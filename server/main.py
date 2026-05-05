from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import ALLOWED_ORIGINS
from app.routers import programs, workouts, stats

app = FastAPI(title="FitForge API", version="0.1.0")

# Allow the React dev server and future production URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(programs.router, prefix="/api")
app.include_router(workouts.router, prefix="/api")
app.include_router(stats.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}

