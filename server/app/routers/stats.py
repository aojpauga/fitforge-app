"""
Stats router — Sprint 5: Progress & Reports.
"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from ..dependencies import get_current_user
from ..database import supabase

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary")
async def get_summary(user=Depends(get_current_user)):
    """Total workouts, this week count, current streak."""
    user_id = user["sub"]

    logs = supabase.table("workout_logs") \
        .select("date") \
        .eq("user_id", user_id) \
        .order("date", desc=True) \
        .execute()

    dates = sorted(set(l["date"] for l in logs.data), reverse=True)
    total = len(dates)

    # This week (Mon–Sun)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    this_week = sum(1 for d in dates if d >= str(week_start))

    # Streak — consecutive days ending today or yesterday
    streak = 0
    check = today
    date_set = set(dates)
    while str(check) in date_set:
        streak += 1
        check -= timedelta(days=1)
    if streak == 0 and str(today - timedelta(days=1)) in date_set:
        check = today - timedelta(days=1)
        while str(check) in date_set:
            streak += 1
            check -= timedelta(days=1)

    return {"total": total, "this_week": this_week, "streak": streak}


@router.get("/volume")
async def get_volume(user=Depends(get_current_user)):
    """Weekly total volume (sets × reps × weight) for the last 8 weeks."""
    user_id = user["sub"]

    sets = supabase.table("workout_sets") \
        .select("reps_done, weight_done, workout_logs(date, user_id)") \
        .eq("workout_logs.user_id", user_id) \
        .execute()

    # Group by week
    weekly: dict[str, float] = {}
    for s in sets.data:
        log = s.get("workout_logs") or {}
        if log.get("user_id") != user_id:
            continue
        d = date.fromisoformat(log["date"])
        week_start = d - timedelta(days=d.weekday())
        key = str(week_start)
        volume = s["reps_done"] * s["weight_done"]
        weekly[key] = weekly.get(key, 0) + volume

    # Last 8 weeks sorted
    sorted_weeks = sorted(weekly.items())[-8:]
    return {
        "weeks": [
            {"week": w, "volume": round(v)}
            for w, v in sorted_weeks
        ]
    }


@router.get("/prs")
async def get_prs(user=Depends(get_current_user)):
    """Best weight × reps (estimated 1RM) per exercise."""
    user_id = user["sub"]

    sets = supabase.table("workout_sets") \
        .select("exercise_id, reps_done, weight_done, exercises(name), workout_logs(date, user_id)") \
        .eq("workout_logs.user_id", user_id) \
        .gt("weight_done", 0) \
        .execute()

    # Epley formula: 1RM = weight × (1 + reps/30)
    best: dict[str, dict] = {}
    for s in sets.data:
        log = s.get("workout_logs") or {}
        if log.get("user_id") != user_id:
            continue
        ex_id = s["exercise_id"]
        name = s.get("exercises", {}).get("name", "Unknown")
        e1rm = s["weight_done"] * (1 + s["reps_done"] / 30)
        if ex_id not in best or e1rm > best[ex_id]["e1rm"]:
            best[ex_id] = {
                "name": name,
                "weight": s["weight_done"],
                "reps": s["reps_done"],
                "e1rm": round(e1rm, 1),
                "date": log.get("date"),
            }

    # Sort by e1rm desc, return top 10
    top = sorted(best.values(), key=lambda x: x["e1rm"], reverse=True)[:10]
    return {"prs": top}


@router.get("/history")
async def get_history(user=Depends(get_current_user)):
    """Recent 10 workout sessions with day label and feeling."""
    user_id = user["sub"]

    logs = supabase.table("workout_logs") \
        .select("id, date, duration_mins, overall_feeling, program_days(label, day_number)") \
        .eq("user_id", user_id) \
        .order("date", desc=True) \
        .limit(10) \
        .execute()

    return {"history": logs.data}
