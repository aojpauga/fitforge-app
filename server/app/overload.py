"""
Progressive overload engine — Sprint 4.
Called after a workout is logged. Calculates whether the user hit their
targets and updates target_weight for the next week's equivalent day.
"""
from .database import supabase


# Weight increments by equipment type
INCREMENTS = {
    "barbell":      5.0,
    "machine":      5.0,
    "cables":       2.5,
    "dumbbells":    2.5,
    "bodyweight":   0.0,
    "kettlebell":   2.5,
    "bands":        0.0,
    "cardio_machine": 0.0,
}


def parse_min_reps(target_reps: str) -> int | None:
    """
    Extract the minimum rep target from a target_reps string.
    Examples:
      "10,8,6,4"  → 4
      "3x8-12"    → 8
      "3x15"      → 15
      "4xfailure" → None (bodyweight/AMRAP, skip overload)
    """
    s = target_reps.lower().strip()
    if "failure" in s or "amrap" in s:
        return None

    # "3x8-12" or "3x15"
    if "x" in s:
        rep_part = s.split("x", 1)[1]
        if "-" in rep_part:
            return int(rep_part.split("-")[0])
        try:
            return int(rep_part)
        except ValueError:
            return None

    # "10,8,6,4"
    if "," in s:
        parts = [p.strip() for p in s.split(",")]
        try:
            return min(int(p) for p in parts if p.isdigit())
        except ValueError:
            return None

    try:
        return int(s)
    except ValueError:
        return None


def did_progress(actual_sets: list[dict], target_reps: str) -> bool:
    """
    Returns True if the user hit their rep target on the majority of sets.
    """
    min_reps = parse_min_reps(target_reps)
    if min_reps is None or not actual_sets:
        return False

    hits = sum(1 for s in actual_sets if s.get("reps_done", 0) >= min_reps)
    return hits >= len(actual_sets) / 2


def run_progressive_overload(program_day_id: str, set_logs: list[dict]):
    """
    Main entry point. Given the logged day and sets, update target_weight
    for the next week's equivalent program_day.
    """
    # Get the program day to find week/day numbers and program_id
    day_result = supabase.table("program_days") \
        .select("week_number, day_number, program_id, program_exercises(*, exercises(equipment))") \
        .eq("id", program_day_id) \
        .single() \
        .execute()

    if not day_result.data:
        return

    day = day_result.data
    current_week = day["week_number"]
    next_week = current_week + 1

    # Find the equivalent day in the next week
    next_day_result = supabase.table("program_days") \
        .select("id, program_exercises(id, exercise_id, target_sets, target_reps, target_weight)") \
        .eq("program_id", day["program_id"]) \
        .eq("week_number", next_week) \
        .eq("day_number", day["day_number"]) \
        .single() \
        .execute()

    if not next_day_result.data:
        return  # Already on last week

    next_day = next_day_result.data
    next_exercises = {pe["exercise_id"]: pe for pe in next_day.get("program_exercises", [])}

    # Group logged sets by exercise_id
    logged_by_exercise: dict[str, list[dict]] = {}
    for s in set_logs:
        ex_id = s["exercise_id"]
        logged_by_exercise.setdefault(ex_id, []).append(s)

    # For each exercise in current day, check if user progressed
    for pe in day.get("program_exercises", []):
        ex_id = pe["exercise_id"]
        equipment = pe.get("exercises", {}).get("equipment", "barbell")
        increment = INCREMENTS.get(equipment, 2.5)

        if increment == 0:
            continue  # Bodyweight/bands — no weight to increment

        actual_sets = logged_by_exercise.get(ex_id, [])
        if not actual_sets:
            continue

        target_reps = pe.get("target_reps", "3x10")
        progressed = did_progress(actual_sets, target_reps)

        if not progressed:
            continue

        # Calculate new target weight
        avg_weight = sum(s.get("weight_done", 0) for s in actual_sets) / len(actual_sets)
        new_weight = round(avg_weight + increment, 1)

        # Update next week's program_exercise target_weight
        next_pe = next_exercises.get(ex_id)
        if next_pe:
            supabase.table("program_exercises") \
                .update({"target_weight": new_weight}) \
                .eq("id", next_pe["id"]) \
                .execute()
