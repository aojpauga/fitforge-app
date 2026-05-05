-- ============================================================
-- AJ'S EXERCISE LIBRARY — Sourced from personal workout history
-- Run this in Supabase SQL Editor AFTER schema.sql
-- These supplement the generic seed with AJ's actual exercise names
-- ============================================================

insert into public.exercises (name, muscle_group, equipment, is_custom)
values

  -- ── CHEST ──────────────────────────────────────────────────
  ('Incline Barbell Bench Press',     'chest',     'barbell',    false),
  ('Machine Chest Fly',               'chest',     'machine',    false),

  -- ── BACK ───────────────────────────────────────────────────
  ('Chin-Up',                         'back',      'bodyweight', false),
  ('Neutral Grip Pull-Up',            'back',      'bodyweight', false),
  ('SA Chest Supported Row',          'back',      'dumbbells',  false),
  ('Wide Grip Lat Pulldown',          'back',      'cables',     false),
  ('Straight Bar Pulldown',           'back',      'cables',     false),
  ('Cable Shrugs',                    'back',      'cables',     false),

  -- ── SHOULDERS ──────────────────────────────────────────────
  ('Arnold Press',                    'shoulders', 'dumbbells',  false),
  ('Reverse Machine Fly',             'shoulders', 'machine',    false),
  ('Cable Rear Delt Fly',             'shoulders', 'cables',     false),
  ('SA Cable Rear Delt Pull',         'shoulders', 'cables',     false),
  ('Seated Machine Overhead Press',   'shoulders', 'machine',    false),

  -- ── TRICEPS ────────────────────────────────────────────────
  ('Wide EZ Bar Cable Pushdown',      'triceps',   'cables',     false),
  ('Double Rope Tricep Pulldown',     'triceps',   'cables',     false),
  ('SA Tricep Kickback',              'triceps',   'dumbbells',  false),
  ('Rope Pushdown',                   'triceps',   'cables',     false),
  ('V-Bar Pushdown',                  'triceps',   'cables',     false),
  ('Seated DB French Press',          'triceps',   'dumbbells',  false),
  ('Rope Overhead Tricep Extension',  'triceps',   'cables',     false),

  -- ── BICEPS ─────────────────────────────────────────────────
  ('EZ Bar Curl',                     'biceps',    'barbell',    false),
  ('Rope Cable Curl',                 'biceps',    'cables',     false),
  ('Rope Hammer Curl',                'biceps',    'cables',     false),
  ('DB Preacher Curl',                'biceps',    'dumbbells',  false),
  ('Incline Dumbbell Curl',           'biceps',    'dumbbells',  false),
  ('EZ Bar Cable Curl',               'biceps',    'cables',     false),

  -- ── LEGS ───────────────────────────────────────────────────
  ('Hack Squat',                      'legs',      'machine',    false),
  ('Single Leg DB RDL',               'legs',      'dumbbells',  false),
  ('Sitting Calf Raise',              'legs',      'machine',    false),
  ('Calf Raise Machine',              'legs',      'machine',    false),
  ('Standing Calf Raise',             'legs',      'bodyweight', false),
  ('DB Romanian Deadlift',            'legs',      'dumbbells',  false),
  ('Walking Lunges',                  'legs',      'bodyweight', false),
  ('Front Squat',                     'legs',      'barbell',    false),

  -- ── GLUTES ─────────────────────────────────────────────────
  ('Glute Bridge',                    'glutes',    'bodyweight', false),
  ('Weighted Glute Bridge',           'glutes',    'barbell',    false),

  -- ── CORE ───────────────────────────────────────────────────
  ('Toes to Bar',                     'core',      'bodyweight', false),
  ('Cable Ab Curl',                   'core',      'cables',     false),
  ('Leg Raises',                      'core',      'bodyweight', false),
  ('Hang Knee Raise',                 'core',      'bodyweight', false),
  ('Bicycle Crunches',                'core',      'bodyweight', false),
  ('Russian Twists',                  'core',      'bodyweight', false),
  ('Side Plank',                      'core',      'bodyweight', false),
  ('Weighted Crunch',                 'core',      'bodyweight', false),
  ('Oblique Crunch',                  'core',      'bodyweight', false),
  ('Mountain Climbers',               'core',      'bodyweight', false),
  ('Lying Leg Raise',                 'core',      'bodyweight', false),
  ('Ab Roller',                       'core',      'bodyweight', false),

  -- ── BACK (additional) ──────────────────────────────────────
  ('T-Bar Row',                       'back',      'barbell',    false),
  ('Pendlay Row',                     'back',      'barbell',    false),
  ('Straight Arm Pulldown',           'back',      'cables',     false),
  ('Barbell Pullover',                'back',      'barbell',    false),
  ('Barbell Shrugs',                  'back',      'barbell',    false),
  ('Dumbbell Shrugs',                 'back',      'dumbbells',  false),

  -- ── SHOULDERS (additional) ─────────────────────────────────
  ('Upright Row',                     'shoulders', 'barbell',    false),
  ('Plate Front Raise',               'shoulders', 'bodyweight', false),
  ('Landmine Press',                  'shoulders', 'barbell',    false),

  -- ── BICEPS (additional) ────────────────────────────────────
  ('Zottman Curl',                    'biceps',    'dumbbells',  false),
  ('Reverse Curl',                    'biceps',    'barbell',    false),

  -- ── LEGS (additional) ──────────────────────────────────────
  ('Goblet Squat',                    'legs',      'dumbbells',  false),
  ('Single Leg Press',                'legs',      'machine',    false),
  ('Barbell RDL',                     'legs',      'barbell',    false),

  -- ── FULL BODY ───────────────────────────────────────────────
  ('Farmer Walk',                     'full_body', 'dumbbells',  false)

on conflict (user_id, name) do nothing;
