import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function DashboardPage() {
  const { profile, preferences, goal, signOut, user } = useAuth()
  const navigate = useNavigate()
  const [program, setProgram] = useState(null)
  const [programLoading, setProgramLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [activeWeek, setActiveWeek] = useState(1)
  const [expandedDay, setExpandedDay] = useState(null)
  const [summary, setSummary] = useState(null)

  // Load active program + stats on mount
  useEffect(() => {
    if (!user) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.access_token) {
        setProgramLoading(false)
        return
      }
      const t = session.access_token
      Promise.all([
        apiFetch('/api/programs/active', t).then(data => setProgram(data.program)),
        apiFetch('/api/stats/summary', t).then(data => setSummary(data)),
      ]).catch(() => {}).finally(() => setProgramLoading(false))
    })
  }, [user])

  async function handleGenerate() {
    if (!preferences) return
    setGenerating(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Session expired — please sign in again.'); return }
      const data = await apiFetch('/api/programs/generate', session.access_token, {
        method: 'POST',
        body: JSON.stringify({
          goal: goal || 'build_muscle',
          weeks: preferences.program_length_weeks || 6,
          days_per_week: preferences.days_per_week || 4,
          experience_level: preferences.experience_level || 'intermediate',
          equipment: preferences.equipment || ['barbell', 'dumbbells', 'cables'],
        }),
      })
      setProgram(data.program)
      setActiveWeek(1)
      setExpandedDay(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  // Get days for active week, sorted by day_number
  const weekDays = program?.program_days
    ?.filter(d => d.week_number === activeWeek)
    ?.sort((a, b) => a.day_number - b.day_number) ?? []

  const totalWeeks = program?.weeks ?? preferences?.program_length_weeks ?? 6

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
        <span className="text-sm font-black tracking-widest uppercase text-white">FitForge</span>
        <button
          onClick={signOut}
          className="text-zinc-500 hover:text-white text-xs tracking-widest uppercase transition"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight uppercase">
            {profile?.name?.split(' ')[0] || 'Athlete'}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Ready to train.</p>
        </div>

        {/* Active Program Card */}
        <div className="border border-zinc-900 rounded-lg p-5 mb-4 bg-zinc-950">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Active Program</p>
            {program && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition"
              >
                Regenerate
              </button>
            )}
          </div>

          {programLoading ? (
            <div className="animate-pulse flex flex-col gap-3">
              <div className="h-5 bg-zinc-900 rounded w-2/3" />
              <div className="flex gap-1.5">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-6 w-10 bg-zinc-900 rounded" />)}
              </div>
              <div className="h-12 bg-zinc-900 rounded" />
              <div className="h-12 bg-zinc-900 rounded" />
            </div>
          ) : !program ? (
            <div className="flex items-center justify-center h-20 border border-dashed border-zinc-800 rounded-lg">
              <div className="text-center">
                {generating ? (
                  <p className="text-zinc-400 text-sm animate-pulse">Building your program...</p>
                ) : (
                  <>
                    <p className="text-zinc-600 text-sm">No program yet</p>
                    <button
                      onClick={handleGenerate}
                      className="mt-1.5 text-white text-sm font-semibold hover:text-zinc-300 transition"
                    >
                      Generate my program
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : generating ? (
            <p className="text-zinc-400 text-sm animate-pulse text-center py-4">Building your program...</p>
          ) : (
            <>
              {/* Program name + week selector */}
              <p className="text-white font-bold text-lg mb-3">{program.name}</p>

              <div className="flex gap-1.5 flex-wrap mb-4">
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => (
                  <button
                    key={w}
                    onClick={() => { setActiveWeek(w); setExpandedDay(null) }}
                    className={`px-2.5 py-1 rounded text-xs font-semibold tracking-wide transition ${
                      activeWeek === w
                        ? 'bg-white text-black'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    W{w}
                  </button>
                ))}
              </div>

              {/* Days for active week */}
              <div className="flex flex-col gap-2">
                {weekDays.map(day => (
                  <div key={day.id} className="border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="w-full flex items-center justify-between px-4 py-3">
                      <button
                        onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
                        className="flex-1 flex items-center text-left"
                      >
                        <div>
                          <span className="text-xs text-zinc-500 uppercase tracking-widest mr-2">Day {day.day_number}</span>
                          <span className="text-sm font-semibold text-white">{day.label}</span>
                        </div>
                      </button>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-600 text-xs" onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}>
                          {day.program_exercises?.length ?? 0} {expandedDay === day.id ? '▲' : '▼'}
                        </span>
                        <button
                          onClick={() => navigate(`/workout/${day.id}`)}
                          className="text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded transition"
                        >
                          Start
                        </button>
                      </div>
                    </div>

                    {expandedDay === day.id && (
                      <div className="border-t border-zinc-800 divide-y divide-zinc-900">
                        {day.program_exercises
                          ?.sort((a, b) => a.order_index - b.order_index)
                          .map((pe, idx) => (
                            <div key={pe.id} className="px-4 py-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white font-medium">
                                  {pe.exercises?.name ?? 'Unknown'}
                                </span>
                                <span className="text-xs text-zinc-400 font-mono">
                                  {pe.target_sets}× {pe.target_reps}
                                </span>
                              </div>
                              {pe.notes && (
                                <p className="text-xs text-zinc-600 mt-0.5">{pe.notes}</p>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {error && (
            <p className="text-red-500 text-xs mt-3">{error}</p>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Total', value: summary?.total ?? 0 },
            { label: 'This Week', value: summary?.this_week ?? 0 },
            { label: 'Streak', value: `${summary?.streak ?? 0}d` },
          ].map(stat => (
            <div key={stat.label} className="border border-zinc-900 bg-zinc-950 rounded-lg p-3 text-center">
              <p className="text-xl font-black text-white">{stat.value}</p>
              <p className="text-zinc-600 text-xs mt-0.5 tracking-wide uppercase">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Preferences Summary */}
        {preferences && (
          <div className="border border-zinc-900 bg-zinc-950 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Your Setup</p>
              <button
                onClick={() => navigate('/profile')}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition"
              >
                Edit
              </button>
            </div>
            <div className="flex flex-col gap-3 text-sm">
              {goal && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Goal</span>
                  <span className="text-white font-semibold capitalize">{goal.replace(/_/g, ' ')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Days / week</span>
                <span className="text-white font-semibold">{preferences.days_per_week}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Experience</span>
                <span className="text-white font-semibold capitalize">{preferences.experience_level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Equipment</span>
                <span className="text-white font-semibold capitalize">
                  {preferences.equipment?.map(e => e.replace(/_/g, ' ')).join(', ') ?? '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-900 flex justify-around py-3 max-w-lg mx-auto">
        {[
          { label: 'Home', path: '/dashboard' },
          { label: 'Progress', path: '/progress' },
          { label: 'Profile', path: '/profile' },
        ].map(tab => (
          <button
            key={tab.label}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-1 transition ${
              tab.path === '/dashboard' ? 'text-white' : 'text-zinc-600 hover:text-white'
            }`}
          >
            <span className="text-[10px] tracking-widest uppercase font-semibold">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
