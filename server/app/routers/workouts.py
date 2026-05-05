"""
Workouts router — Sprint 3 & 4: Logging + progressive overload.
"""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..dependencies import get_current_user
from ..database import supabase
from ..overload import run_progressive_overload

router = APIRouter(prefix="/workouts", tags=["workouts"])


class SetLog(BaseModel):
    exercise_id: str
    set_number: int
    reps_done: int
    weight_done: float


class LogWorkoutRequest(BaseModel):
    program_day_id: str
    date: str = str(date.today())
    duration_mins: int | None = None
    overall_feeling: int | None = None  # 1-5
    notes: str | None = None
    sets: list[SetLog]


@router.post("/log")
async def log_workout(body: LogWorkoutRequest, user=Depends(get_current_user)):
    user_id = user["sub"]

    # Save the workout log
    log_result = supabase.table("workout_logs").insert({
        "user_id": user_id,
        "program_day_id": body.program_day_id,
        "date": body.date,
        "duration_mins": body.duration_mins,
        "overall_feeling": body.overall_feeling,
        "notes": body.notes,
    }).execute()

    if not log_result.data:
        raise HTTPException(status_code=500, detail="Failed to save workout log.")

    log_id = log_result.data[0]["id"]

    # Save all sets
    set_dicts = []
    if body.sets:
        set_dicts = [
            {
                "workout_log_id": log_id,
                "exercise_id": s.exercise_id,
                "set_number": s.set_number,
                "reps_done": s.reps_done,
                "weight_done": s.weight_done,
            }
            for s in body.sets
        ]
        supabase.table("workout_sets").insert(set_dicts).execute()

    # Run progressive overload for the next week
    try:
        run_progressive_overload(
            program_day_id=body.program_day_id,
            set_logs=[s.model_dump() for s in body.sets],
        )
    except Exception:
        pass  # Overload failure should never block the log save

    return {"log_id": log_id, "message": "Workout logged."}


@router.get("/history")
async def get_workout_history(user=Depends(get_current_user)):
    user_id = user["sub"]
    result = supabase.table("workout_logs") \
        .select("*, workout_sets(*, exercises(*))") \
        .eq("user_id", user_id) \
        .order("date", desc=True) \
        .execute()
    return {"logs": result.data}


@router.get("/last/{exercise_id}")
async def get_last_performance(exercise_id: str, user=Depends(get_current_user)):
    """Returns the most recent logged sets for a given exercise."""
    user_id = user["sub"]

    # Find the most recent workout log that has sets for this exercise
    result = supabase.table("workout_sets") \
        .select("set_number, reps_done, weight_done, workout_logs(date, user_id)") \
        .eq("exercise_id", exercise_id) \
        .eq("workout_logs.user_id", user_id) \
        .order("created_at", desc=True) \
        .limit(10) \
        .execute()

    sets = [s for s in result.data if s.get("workout_logs", {}).get("user_id") == user_id]
    if not sets:
        return {"last": None}

    last_date = sets[0]["workout_logs"]["date"]
    last_sets = [s for s in sets if s["workout_logs"]["date"] == last_date]

    return {
        "last": {
            "date": last_date,
            "sets": [{"set": s["set_number"], "weight": s["weight_done"], "reps": s["reps_done"]} for s in last_sets]
        }
    }
