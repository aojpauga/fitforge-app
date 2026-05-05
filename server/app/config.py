from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
# Comma-separated list of additional allowed origins (e.g. Vercel preview URLs)
_extra = os.getenv("EXTRA_ORIGINS", "")
ALLOWED_ORIGINS = [o.strip() for o in [FRONTEND_URL, "http://localhost:5173"] + (_extra.split(",") if _extra else []) if o.strip()]

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")

if not ANTHROPIC_API_KEY:
    raise RuntimeError("Missing ANTHROPIC_API_KEY in .env")
