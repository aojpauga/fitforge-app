# FitForge — iOS Conversion Handoff

This document gives a new Claude session everything needed to continue building FitForge as a native iOS app in Xcode/SwiftUI.

---

## What This App Is

FitForge is AJ's personal fitness app. It replicates his exact training style:
- AI-generated workout programs (via Claude API) using his personal exercise library
- Set-by-set workout logging with weight/reps
- Progressive overload: auto-increments target weight after each logged week
- Progress tracking: weekly volume, estimated 1RM PRs, session history

AJ has SwiftUI experience. He knows his codebase. Be direct and technical.

---

## Current State

### What's fully built and working
- FastAPI backend (Python) — all endpoints complete
- Supabase database — schema live, 99 exercises seeded, AJ's data is in there
- React/Vite web app — complete through Sprint 6 (auth, onboarding, dashboard, workout logging, progress, profile)

### What's next
1. **Deploy the backend to Render** (free tier) — the iOS app needs it hosted
2. **Build the iOS app in SwiftUI** — full rewrite of the frontend, backend stays as-is

---

## GitHub Repo

```
https://github.com/aojpauga/fitforge-app
```
Private repo. The full web app + backend is here.

---

## Backend Deployment (Do This First)

Deploy `server/` to Render before starting the iOS app.

1. Go to render.com → New → Web Service → connect `aojpauga/fitforge-app`
2. Settings:
   - **Root Directory**: `server`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free
3. Environment Variables (copy values from `server/.env` on your Windows machine):
   ```
   SUPABASE_URL=           ← from server/.env
   SUPABASE_SERVICE_KEY=   ← from server/.env
   ANTHROPIC_API_KEY=      ← from server/.env
   FRONTEND_URL=*
   ```
4. After deploy you get a URL like `https://fitforge-api.onrender.com` — use this as the API base URL in the iOS app.

**Note:** Free Render tier spins down after 15 min inactivity. First request takes ~30s to wake up. Acceptable for personal use.

---

## Supabase Credentials

Copy both values from `client/.env` on your Windows machine:
```
VITE_SUPABASE_URL=      ← this is your Supabase URL
VITE_SUPABASE_ANON_KEY= ← this is your anon key
```

Use the Supabase Swift SDK for auth. Add via Swift Package Manager:
```
https://github.com/supabase/supabase-swift
```

---

## API Endpoints

All endpoints require `Authorization: Bearer <supabase_jwt>` header.
Base URL: your Render URL (e.g. `https://fitforge-api.onrender.com`)

### Programs
```
GET  /api/programs/active
     → { program: Program? }
     Program includes nested program_days → program_exercises → exercises

POST /api/programs/generate
     Body: {
       goal: "build_muscle" | "lose_weight" | "endurance" | "general_fitness",
       weeks: 6 | 8,
       days_per_week: 2-6,
       experience_level: "beginner" | "intermediate" | "advanced",
       equipment: ["barbell", "dumbbells", "cables", ...]
     }
     → { program: Program }
     Takes 10-20 seconds (calls Claude API)
```

### Workouts
```
POST /api/workouts/log
     Body: {
       program_day_id: String,
       date: "YYYY-MM-DD",
       duration_mins: Int?,
       overall_feeling: Int? (1-5),
       sets: [{ exercise_id, set_number, reps_done, weight_done }]
     }
     → { log_id: String, message: String }
     Also triggers progressive overload for next week automatically

GET  /api/workouts/last/{exercise_id}
     → { last: { date: String, sets: [{ set, weight, reps }] }? }
     Used to show "last time" reference during a workout
```

### Stats
```
GET /api/stats/summary
    → { total: Int, this_week: Int, streak: Int }

GET /api/stats/volume
    → { weeks: [{ week: "YYYY-MM-DD", volume: Int }] }
    Last 8 weeks of total volume (reps × weight per set)

GET /api/stats/prs
    → { prs: [{ name, weight, reps, e1rm, date }] }
    Top 10 lifts by estimated 1RM (Epley formula)

GET /api/stats/history
    → { history: [{ id, date, duration_mins, overall_feeling, program_days: { label } }] }
    Last 10 sessions
```

---

## Database Schema (Key Tables)

```
profiles          id, name, created_at
goals             id, user_id, type (build_muscle|lose_weight|endurance|general_fitness)
user_preferences  user_id, days_per_week, experience_level, equipment[], program_length_weeks
exercises         id, name, muscle_group, equipment, is_custom
programs          id, user_id, name, weeks, status (active|completed|paused)
program_days      id, program_id, week_number, day_number, label
program_exercises id, program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight, notes
workout_logs      id, user_id, program_day_id, date, duration_mins, overall_feeling
workout_sets      id, workout_log_id, exercise_id, set_number, reps_done, weight_done
```

---

## iOS App — Sprint Plan

### Architecture
- SwiftUI + `@MainActor` / `@StateObject` / `@EnvironmentObject`
- `SupabaseClient` singleton for auth (Swift SDK)
- `APIService` for all FastAPI calls (async/await + URLSession)
- `TabView` for main navigation (Dashboard | Progress | Profile)
- No CoreData — all data lives in Supabase/API

### Recommended File Structure
```
FitForge/
├── FitForgeApp.swift          — app entry, inject environment objects
├── Core/
│   ├── SupabaseClient.swift   — singleton: Supabase.init(url:key:)
│   ├── APIService.swift       — all fetch/post calls to FastAPI
│   └── AuthManager.swift      — @MainActor ObservableObject, session state
├── Models/
│   ├── Program.swift          — Program, ProgramDay, ProgramExercise, Exercise
│   ├── WorkoutLog.swift       — WorkoutLog, WorkoutSet
│   └── Stats.swift            — Summary, VolumeWeek, PR, HistoryEntry
├── Views/
│   ├── Auth/
│   │   └── AuthView.swift     — login + signup tabs
│   ├── Onboarding/
│   │   └── OnboardingView.swift — 3-step: goal → preferences → equipment
│   ├── Dashboard/
│   │   ├── DashboardView.swift
│   │   └── ProgramDayRow.swift
│   ├── Workout/
│   │   ├── WorkoutView.swift  — set logging per exercise
│   │   └── ExerciseCard.swift
│   ├── Progress/
│   │   └── ProgressView.swift — Swift Charts volume, PR list, history
│   └── Profile/
│       └── ProfileView.swift  — edit goal, preferences, equipment
```

### Sprint Breakdown

**Sprint 1 — Auth + Onboarding**
- AuthView: email/password login + signup using Supabase Swift SDK
- Detect if user has `user_preferences` row → if not, show OnboardingView
- OnboardingView: 3 steps (goal, training prefs, equipment) → POST to Supabase directly via Swift SDK
- On completion navigate to Dashboard

**Sprint 2 — Dashboard**
- Fetch active program via `GET /api/programs/active`
- Show program name, week picker (segmented or scroll), expandable day rows
- "Start" button per day → navigate to WorkoutView with dayId
- If no program → "Generate Program" button → `POST /api/programs/generate`
- Stats row: total / this week / streak from `GET /api/stats/summary`

**Sprint 3 — Workout Logging**
- WorkoutView receives a `ProgramDay`
- For each exercise: show target sets × reps, last performance, input grid (set | weight | reps)
- Feeling picker: 1-5 (Rough / Hard / Solid / Great / Beast)
- "Finish Workout" → `POST /api/workouts/log` → back to Dashboard

**Sprint 4 — Progressive Overload**
- Already handled server-side automatically when logging — no iOS work needed
- Just make sure WorkoutView pre-fills weight from `target_weight` on each `ProgramExercise`
- Show last performance via `GET /api/workouts/last/{exercise_id}`

**Sprint 5 — Progress**
- ProgressView using Swift Charts (iOS 16+, no external dependency)
- Bar chart: weekly volume from `/api/stats/volume`
- PR list from `/api/stats/prs`
- Recent sessions from `/api/stats/history`

**Sprint 6 — Profile**
- ProfileView: show name, email, goal, preferences
- Edit goal → insert new row to `goals` table via Supabase Swift SDK
- Edit preferences → upsert `user_preferences` via Supabase Swift SDK

---

## Key Data Models (Swift)

```swift
// Matches what /api/programs/active returns
struct Program: Codable, Identifiable {
    let id: String
    let name: String
    let weeks: Int
    let status: String
    let programDays: [ProgramDay]

    enum CodingKeys: String, CodingKey {
        case id, name, weeks, status
        case programDays = "program_days"
    }
}

struct ProgramDay: Codable, Identifiable {
    let id: String
    let weekNumber: Int
    let dayNumber: Int
    let label: String
    let programExercises: [ProgramExercise]

    enum CodingKeys: String, CodingKey {
        case id, label
        case weekNumber = "week_number"
        case dayNumber = "day_number"
        case programExercises = "program_exercises"
    }
}

struct ProgramExercise: Codable, Identifiable {
    let id: String
    let exerciseId: String
    let orderIndex: Int
    let targetSets: Int
    let targetReps: String
    let targetWeight: Double?
    let notes: String?
    let exercises: Exercise?

    enum CodingKeys: String, CodingKey {
        case id, notes
        case exerciseId = "exercise_id"
        case orderIndex = "order_index"
        case targetSets = "target_sets"
        case targetReps = "target_reps"
        case targetWeight = "target_weight"
        case exercises
    }
}

struct Exercise: Codable, Identifiable {
    let id: String
    let name: String
    let muscleGroup: String
    let equipment: String

    enum CodingKeys: String, CodingKey {
        case id, name
        case muscleGroup = "muscle_group"
        case equipment
    }
}

struct StatsSummary: Codable {
    let total: Int
    let thisWeek: Int
    let streak: Int

    enum CodingKeys: String, CodingKey {
        case total, streak
        case thisWeek = "this_week"
    }
}

struct PR: Codable, Identifiable {
    var id: String { name }
    let name: String
    let weight: Double
    let reps: Int
    let e1rm: Double
    let date: String?
}
```

---

## Auth Flow in the iOS App

```swift
// 1. Sign in with Supabase Swift SDK
let session = try await supabase.auth.signIn(email: email, password: password)

// 2. Get the JWT token to pass to your FastAPI backend
let token = session.accessToken

// 3. Every API call includes:
var request = URLRequest(url: url)
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
request.setValue("application/json", forHTTPHeaderField: "Content-Type")

// 4. To get the current session anywhere:
let session = try await supabase.auth.session
let token = session.accessToken
```

---

## Progressive Overload Logic (Server-Side — No iOS Code Needed)

After `POST /api/workouts/log`, the server automatically:
1. Finds the same day in the next week of the program
2. Checks if the user hit their rep targets
3. If yes: increments `target_weight` on `program_exercises` for that next week
   - Barbell/Machine: +5 lbs
   - Cables/Dumbbells: +2.5 lbs
   - Bodyweight: no change

The iOS app just needs to pre-fill weight inputs from `target_weight` when showing a workout — the overload logic is invisible to the client.

---

## Design Style

The web app uses a dark minimal aesthetic. Keep the same vibe in SwiftUI:
- Background: `.black` / `Color(UIColor.systemBackground)` in dark mode
- Text: `.white`, secondary `.gray`
- Accent: `.white` buttons with black text (inverted)
- Font style: bold, uppercase tracking for labels
- No colored accents — monochrome throughout
- Target: iPhone only, portrait orientation

---

## What to Tell Claude on the Mac

Paste this entire document as context at the start of the conversation. Then say:

> "I'm building FitForge as a native iOS app in Xcode/SwiftUI. The backend is already built and will be deployed to Render. I have SwiftUI experience. Let's start with Sprint 1 — auth and onboarding. Create the Xcode project structure and build AuthView first."
