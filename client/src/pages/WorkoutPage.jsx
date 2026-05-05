import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const API = import.meta.env.VITE_API_URL

async function apiFetch(path, token, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

export default function WorkoutPage() {
  const { dayId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const startTime = useRef(Date.now())

  const [day, setDay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [lastPerf, setLastPerf] = useState({}) // exercise_id → last performance

  // sets[exerciseIndex][setIndex] = { reps, weight }
  const [sets, setSets] = useState([])

  // overall feeling 1-5
  const [feeling, setFeeling] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      apiFetch('/api/programs/active', session.access_token)
        .then(async data => {
          const allDays = data.program?.program_days ?? []
          const found = allDays.find(d => d.id === dayId)
          if (!found) { navigate('/dashboard'); return }

          found.program_exercises = found.program_exercises
            ?.sort((a, b) => a.order_index - b.order_index) ?? []

          setDay(found)

          // Init sets — pre-fill weight from target_weight if available
          setSets(found.program_exercises.map(pe => {
            const numSets = pe.target_sets ?? 3
            const w = pe.target_weight ? String(pe.target_weight) : ''
            return Array.from({ length: numSets }, () => ({ reps: '', weight: w }))
          }))

          // Fetch last performance for each exercise in parallel
          const perfResults = await Promise.allSettled(
            found.program_exercises.map(pe =>
              apiFetch(`/api/workouts/last/${pe.exercise_id}`, session.access_token)
                .then(d => ({ id: pe.exercise_id, last: d.last }))
            )
          )
          const perfMap = {}
          perfResults.forEach(r => {
            if (r.status === 'fulfilled' && r.value.last) {
              perfMap[r.value.id] = r.value.last
            }
          })
          setLastPerf(perfMap)
        })
        .catch(() => navigate('/dashboard'))
        .finally(() => setLoading(false))
    })
  }, [user, dayId])

  function updateSet(exIdx, setIdx, field, value) {
    setSets(prev => {
      const next = prev.map(s => [...s])
      next[exIdx][setIdx] = { ...next[exIdx][setIdx], [field]: value }
      return next
    })
  }

  async function handleFinish() {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const durationMins = Math.round((Date.now() - startTime.current) / 60000)

      // Build set logs — skip empty rows
      const setLogs = []
      day.program_exercises.forEach((pe, exIdx) => {
        sets[exIdx]?.forEach((s, setIdx) => {
          const reps = parseInt(s.reps)
          const weight = parseFloat(s.weight)
          if (!isNaN(reps) && reps > 0) {
            setLogs.push({
              exercise_id: pe.exercise_id,
              set_number: setIdx + 1,
              reps_done: reps,
              weight_done: isNaN(weight) ? 0 : weight,
            })
          }
        })
      })

      await apiFetch('/api/workouts/log', session.access_token, {
        method: 'POST',
        body: JSON.stringify({
          program_day_id: dayId,
          date: new Date().toISOString().split('T')[0],
          duration_mins: durationMins,
          overall_feeling: feeling,
          sets: setLogs,
        }),
      })

      setDone(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-500 text-sm animate-pulse">Loading workout...</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl font-black text-white uppercase tracking-tight">Done.</p>
          <p className="text-zinc-500 text-sm mt-2">Workout saved.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-zinc-500 hover:text-white text-xs tracking-widest uppercase transition"
        >
          ← Back
        </button>
        <span className="text-xs font-black tracking-widest uppercase text-white">FitForge</span>
        <div className="w-12" />
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        {/* Day label */}
        <div className="mb-6">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Day {day.day_number}</p>
          <h1 className="text-2xl font-black tracking-tight uppercase">{day.label}</h1>
        </div>

        {/* Exercises */}
        <div className="flex flex-col gap-6">
          {day.program_exercises.map((pe, exIdx) => (
            <div key={pe.id} className="border border-zinc-900 rounded-lg overflow-hidden">
              {/* Exercise header */}
              <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-900">
                <p className="text-sm font-bold text-white">{pe.exercises?.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Target: {pe.target_sets} × {pe.target_reps}
                  {pe.target_weight ? ` @ ${pe.target_weight} lbs` : ''}
                </p>
                {lastPerf[pe.exercise_id] && (
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Last ({lastPerf[pe.exercise_id].date}): {lastPerf[pe.exercise_id].sets.map(s => `${s.weight}×${s.reps}`).join(', ')}
                  </p>
                )}
              </div>

              {/* Set rows */}
              <div className="divide-y divide-zinc-900">
                {/* Column headers */}
                <div className="grid grid-cols-3 px-4 py-2 text-[10px] text-zinc-600 uppercase tracking-widest">
                  <span>Set</span>
                  <span className="text-center">Weight (lbs)</span>
                  <span className="text-right">Reps</span>
                </div>

                {sets[exIdx]?.map((s, setIdx) => (
                  <div key={setIdx} className="grid grid-cols-3 items-center px-4 py-2.5 gap-2">
                    <span className="text-sm text-zinc-400 font-semibold">{setIdx + 1}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      enterKeyHint="next"
                      placeholder="0"
                      value={s.weight}
                      onChange={e => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                      className="bg-zinc-900 text-white text-sm text-center rounded px-2 py-2 w-full outline-none focus:ring-1 focus:ring-white"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      enterKeyHint="done"
                      placeholder="0"
                      value={s.reps}
                      onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                      className="bg-zinc-900 text-white text-sm text-right rounded px-2 py-2 w-full outline-none focus:ring-1 focus:ring-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* How did it feel */}
        <div className="mt-8 border border-zinc-900 rounded-lg p-4 bg-zinc-950">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">How did it feel?</p>
          <div className="flex gap-2">
            {[
              { val: 1, label: 'Rough' },
              { val: 2, label: 'Hard' },
              { val: 3, label: 'Solid' },
              { val: 4, label: 'Great' },
              { val: 5, label: 'Beast' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setFeeling(val)}
                className={`flex-1 py-2 rounded text-xs font-semibold transition ${
                  feeling === val
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Sticky finish button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-5 pb-6 pt-3 bg-black border-t border-zinc-900">
        <button
          onClick={handleFinish}
          disabled={saving}
          className="w-full bg-white text-black font-black text-sm tracking-widest uppercase py-4 rounded-lg hover:bg-zinc-200 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Finish Workout'}
        </button>
      </div>
    </div>
  )
}
