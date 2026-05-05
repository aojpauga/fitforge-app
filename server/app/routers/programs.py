"""
Programs router — Sprint 2: AI program generation via Claude API.
"""
import json
import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..dependencies import get_current_user
from ..database import supabase
from ..config import ANTHROPIC_API_KEY

router = APIRouter(prefix="/programs", tags=["programs"])

claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


class GenerateProgramRequest(BaseModel):
    goal: str            # build_muscle | lose_weight | endurance | general_fitness
    weeks: int           # 6 or 8
    days_per_week: int
    experience_level: str
    equipment: list[str]


# ── Day templates per days_per_week ────────────────────────────────────────────
DAY_TEMPLATES = {
    2: ["Full Body A", "Full Body B"],
    3: ["Push (Chest/Shoulders/Triceps)", "Pull (Back/Biceps)", "Legs"],
    4: ["Chest / Triceps", "Back / Biceps", "Legs", "Shoulders / Arms"],
    5: ["Chest / Triceps", "Back / Biceps", "Legs", "Shoulders", "Arms / Core"],
    6: ["Chest / Triceps", "Back / Biceps", "Shoulders", "Chest / Triceps", "Back / Biceps", "Legs / Core"],
}


@router.post("/generate")
async def generate_program(body: GenerateProgramRequest, user=Depends(get_current_user)):
    user_id = user["sub"]

    # ── 1. Fetch exercises available for user's equipment ──────────────────────
    equipment_filter = list(set(body.equipment + ["bodyweight"]))
    ex_result = supabase.table("exercises") \
        .select("id, name, muscle_group, equipment") \
        .in_("equipment", equipment_filter) \
        .execute()

    if not ex_result.data:
        raise HTTPException(status_code=400, detail="No exercises found for selected equipment.")

    # Group by muscle group for the prompt
    by_muscle: dict[str, list[str]] = {}
    exercise_map: dict[str, str] = {}   # name → id
    for ex in ex_result.data:
        by_muscle.setdefault(ex["muscle_group"], []).append(ex["name"])
        exercise_map[ex["name"]] = ex["id"]

    exercise_list_text = "\n".join(
        f"  {mg.upper()}: {', '.join(names)}"
        for mg, names in sorted(by_muscle.items())
    )

    day_labels = DAY_TEMPLATES.get(body.days_per_week, DAY_TEMPLATES[4])

    # ── 2. Build Claude prompt ─────────────────────────────────────────────────
    system_prompt = """You are an expert strength and hypertrophy coach. You generate structured workout programs in JSON format.
Follow these rules exactly:
- Use ONLY exercises from the provided list — do not invent exercises.
- Match exercise names exactly as written in the list.
- Output ONLY valid JSON, no explanation, no markdown fences.
- The JSON must match the schema provided."""

    user_prompt = f"""Generate a {body.weeks}-week, {body.days_per_week}-day/week workout program.

Goal: {body.goal.replace("_", " ")}
Experience level: {body.experience_level}
Equipment available: {", ".join(body.equipment)}

Training split (use these exact labels):
{chr(10).join(f"Day {i+1}: {label}" for i, label in enumerate(day_labels))}

Available exercises (use ONLY these, spelled exactly):
{exercise_list_text}

Sets/reps conventions:
- Primary barbell compounds (bench, squat, deadlift, row, press): target_reps = "10,8,6,4"
- Accessory hypertrophy (8-12 rep range): target_reps = "3x8-12"
- High-rep accessories (15 rep range): target_reps = "3x15"
- Very high rep / endurance: target_reps = "3x20"
- Bodyweight to failure: target_reps = "4xfailure"
- Beginners use higher reps, advanced use lower reps with more intensity.

Return ONLY this JSON structure (no markdown, no explanation):
{{
  "name": "<program name>",
  "days": [
    {{
      "day_number": 1,
      "label": "<exact label from split above>",
      "exercises": [
        {{
          "exercise_name": "<exact name from list>",
          "order_index": 0,
          "target_sets": 4,
          "target_reps": "10,8,6,4",
          "notes": "<brief coaching note>"
        }}
      ]
    }}
  ]
}}

Include 4-7 exercises per day. Day structure repeats each week (progressive overload handles weight increases)."""

    # ── 3. Call Claude API ─────────────────────────────────────────────────────
    try:
        message = claude.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        raw = message.content[0].text.strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude API error: {str(e)}")

    # ── 4. Parse response ──────────────────────────────────────────────────────
    try:
        program_data = json.loads(raw)
    except json.JSONDecodeError:
        # Try stripping accidental markdown fences
        clean = raw.strip("` \n")
        if clean.startswith("json"):
            clean = clean[4:].strip()
        try:
            program_data = json.loads(clean)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=502, detail=f"Failed to parse Claude response: {str(e)}")

    # ── 5. Save program ────────────────────────────────────────────────────────
    prog_result = supabase.table("programs").insert({
        "user_id": user_id,
        "name": program_data["name"],
        "weeks": body.weeks,
        "status": "active",
    }).execute()

    if not prog_result.data:
        raise HTTPException(status_code=500, detail="Failed to save program.")

    program_id = prog_result.data[0]["id"]

    # ── 6. Save program days + exercises (repeated for each week) ──────────────
    ai_days = program_data["days"]

    for week in range(1, body.weeks + 1):
        for ai_day in ai_days:
            # Create program day
            day_result = supabase.table("program_days").insert({
                "program_id": program_id,
                "week_number": week,
                "day_number": ai_day["day_number"],
                "label": ai_day["label"],
            }).execute()

            if not day_result.data:
                continue

            day_id = day_result.data[0]["id"]

            # Create exercises for this day
            exercises_to_insert = []
            for ex in ai_day.get("exercises", []):
                ex_name = ex.get("exercise_name", "")
                ex_id = exercise_map.get(ex_name)
                if not ex_id:
                    # Fuzzy fallback: case-insensitive match
                    ex_id = next(
                        (v for k, v in exercise_map.items() if k.lower() == ex_name.lower()),
                        None
                    )
                if not ex_id:
                    continue  # Skip unknown exercises

                exercises_to_insert.append({
                    "program_day_id": day_id,
                    "exercise_id": ex_id,
                    "order_index": ex.get("order_index", 0),
                    "target_sets": ex.get("target_sets", 3),
                    "target_reps": ex.get("target_reps", "3x10"),
                    "notes": ex.get("notes"),
                })

            if exercises_to_insert:
                supabase.table("program_exercises").insert(exercises_to_insert).execute()

    # ── 7. Return the full saved program ───────────────────────────────────────
    final = supabase.table("programs") \
        .select("*, program_days(*, program_exercises(*, exercises(*)))") \
        .eq("id", program_id) \
        .single() \
        .execute()

    return {"program": final.data}


@router.get("/active")
async def get_active_program(user=Depends(get_current_user)):
    """Returns the user's currently active program with all days."""
    user_id = user["sub"]
    result = supabase.table("programs") \
        .select("*, program_days(*, program_exercises(*, exercises(*)))") \
        .eq("user_id", user_id) \
        .eq("status", "active") \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()

    if not result.data:
        return {"program": None}
    return {"program": result.data[0]}


@router.get("/")
async def list_programs(user=Depends(get_current_user)):
    """Returns all programs for the user."""
    user_id = user["sub"]
    result = supabase.table("programs") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .execute()
    return {"programs": result.data}
