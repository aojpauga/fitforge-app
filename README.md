# FitForge — AI Fitness App

## Sprint Status
- [x] Sprint 1 — Auth, Onboarding, Dashboard shell
- [ ] Sprint 2 — AI Program Generation
- [ ] Sprint 3 — Workout Logging
- [ ] Sprint 4 — Progressive Overload Engine
- [ ] Sprint 5 — Reports & Charts
- [ ] Sprint 6 — Polish & Mobile UX

---

## Setup

### 1. Supabase
1. Create a free project at supabase.com
2. Go to **SQL Editor** → paste and run `supabase/schema.sql`
3. Copy your **Project URL** and **anon key** from Project Settings → API

### 2. Anthropic API Key
Get one at console.anthropic.com → API Keys

### 3. Frontend
```bash
cd client
cp .env.example .env       # fill in your Supabase URL + anon key
npm install
npm run dev                # runs at http://localhost:5173
```

### 4. Backend
```bash
cd server
cp .env.example .env       # fill in Supabase URL + service key + Anthropic key
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn main:app --reload  # runs at http://localhost:8000
```

---

## Project Structure
```
fitness-app/
├── client/         React + Vite + Tailwind (frontend)
├── server/         FastAPI (backend / AI logic)
└── supabase/       Database schema SQL
```
