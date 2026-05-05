import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const GOALS = [
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'general_fitness', label: 'General Fitness' },
]

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const EQUIPMENT_OPTIONS = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'cables', label: 'Cables' },
  { value: 'machine', label: 'Machines' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'bands', label: 'Bands' },
]

export default function ProfilePage() {
  const { profile, preferences, goal, savePreferences, saveGoal, signOut } = useAuth()
  const navigate = useNavigate()

  const [editingGoal, setEditingGoal] = useState(false)
  const [editingPrefs, setEditingPrefs] = useState(false)

  // Goal edit state
  const [draftGoal, setDraftGoal] = useState(goal ?? '')

  // Prefs edit state
  const [draftPrefs, setDraftPrefs] = useState({
    days_per_week: preferences?.days_per_week ?? 4,
    experience_level: preferences?.experience_level ?? '',
    program_length_weeks: preferences?.program_length_weeks ?? 6,
    equipment: preferences?.equipment ?? [],
  })

  const [savingGoal, setSavingGoal] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [goalError, setGoalError] = useState(null)
  const [prefsError, setPrefsError] = useState(null)

  function toggleEquipment(val) {
    setDraftPrefs(p => ({
      ...p,
      equipment: p.equipment.includes(val)
        ? p.equipment.filter(e => e !== val)
        : [...p.equipment, val],
    }))
  }

  async function handleSaveGoal() {
    if (!draftGoal) return
    setSavingGoal(true)
    setGoalError(null)
    const { error } = await saveGoal(draftGoal)
    if (error) setGoalError('Failed to save goal.')
    else setEditingGoal(false)
    setSavingGoal(false)
  }

  async function handleSavePrefs() {
    if (!draftPrefs.experience_level || draftPrefs.equipment.length === 0) return
    setSavingPrefs(true)
    setPrefsError(null)
    const { error } = await savePreferences(draftPrefs)
    if (error) setPrefsError('Failed to save preferences.')
    else setEditingPrefs(false)
    setSavingPrefs(false)
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
        <span className="text-sm font-black tracking-widest uppercase text-white">FitForge</span>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8">
        <h1 className="text-2xl font-black tracking-tight uppercase mb-6">Profile</h1>

        {/* Identity */}
        <div className="border border-zinc-900 bg-zinc-950 rounded-lg p-5 mb-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">Account</p>
          <p className="text-white font-semibold">{profile?.name ?? '—'}</p>
          <p className="text-zinc-500 text-sm mt-0.5">{profile?.email ?? '—'}</p>
        </div>

        {/* Goal */}
        <div className="border border-zinc-900 bg-zinc-950 rounded-lg p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Goal</p>
            {!editingGoal && (
              <button
                onClick={() => { setDraftGoal(goal ?? ''); setEditingGoal(true) }}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition"
              >
                Edit
              </button>
            )}
          </div>

          {editingGoal ? (
            <>
              <div className="flex flex-col gap-2 mb-4">
                {GOALS.map(g => (
                  <button
                    key={g.value}
                    onClick={() => setDraftGoal(g.value)}
                    className={`py-2.5 px-4 rounded text-sm font-semibold text-left transition ${
                      draftGoal === g.value
                        ? 'bg-white text-black'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              {goalError && <p className="text-red-500 text-xs mb-3">{goalError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingGoal(false)}
                  className="flex-1 border border-zinc-800 text-zinc-400 py-2 rounded text-sm transition hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGoal}
                  disabled={savingGoal || !draftGoal}
                  className="flex-1 bg-white text-black font-bold py-2 rounded text-sm transition hover:bg-zinc-200 disabled:opacity-40"
                >
                  {savingGoal ? 'Saving...' : 'Save'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-white font-semibold capitalize">{goal?.replace(/_/g, ' ') ?? '—'}</p>
          )}
        </div>

        {/* Preferences */}
        <div className="border border-zinc-900 bg-zinc-950 rounded-lg p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Training Preferences</p>
            {!editingPrefs && (
              <button
                onClick={() => {
                  setDraftPrefs({
                    days_per_week: preferences?.days_per_week ?? 4,
                    experience_level: preferences?.experience_level ?? '',
                    program_length_weeks: preferences?.program_length_weeks ?? 6,
                    equipment: preferences?.equipment ?? [],
                  })
                  setEditingPrefs(true)
                }}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition"
              >
                Edit
              </button>
            )}
          </div>

          {editingPrefs ? (
            <>
              {/* Days/week */}
              <div className="mb-4">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Days / week</p>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map(d => (
                    <button
                      key={d}
                      onClick={() => setDraftPrefs(p => ({ ...p, days_per_week: d }))}
                      className={`w-10 h-10 rounded text-sm font-bold transition ${
                        draftPrefs.days_per_week === d
                          ? 'bg-white text-black'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div className="mb-4">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Experience</p>
                <div className="flex gap-2">
                  {EXPERIENCE_LEVELS.map(l => (
                    <button
                      key={l.value}
                      onClick={() => setDraftPrefs(p => ({ ...p, experience_level: l.value }))}
                      className={`flex-1 py-2 rounded text-xs font-semibold transition ${
                        draftPrefs.experience_level === l.value
                          ? 'bg-white text-black'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Program length */}
              <div className="mb-4">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Program Length</p>
                <div className="flex gap-2">
                  {[4, 6, 8, 12].map(w => (
                    <button
                      key={w}
                      onClick={() => setDraftPrefs(p => ({ ...p, program_length_weeks: w }))}
                      className={`flex-1 py-2 rounded text-xs font-semibold transition ${
                        draftPrefs.program_length_weeks === w
                          ? 'bg-white text-black'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {w}w
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div className="mb-4">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Equipment</p>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_OPTIONS.map(eq => (
                    <button
                      key={eq.value}
                      onClick={() => toggleEquipment(eq.value)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                        draftPrefs.equipment.includes(eq.value)
                          ? 'bg-white text-black'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {eq.label}
                    </button>
                  ))}
                </div>
              </div>

              {prefsError && <p className="text-red-500 text-xs mb-3">{prefsError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingPrefs(false)}
                  className="flex-1 border border-zinc-800 text-zinc-400 py-2 rounded text-sm transition hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePrefs}
                  disabled={savingPrefs || !draftPrefs.experience_level || draftPrefs.equipment.length === 0}
                  className="flex-1 bg-white text-black font-bold py-2 rounded text-sm transition hover:bg-zinc-200 disabled:opacity-40"
                >
                  {savingPrefs ? 'Saving...' : 'Save'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Days / week</span>
                <span className="text-white font-semibold">{preferences?.days_per_week ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Experience</span>
                <span className="text-white font-semibold capitalize">{preferences?.experience_level ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Program length</span>
                <span className="text-white font-semibold">{preferences?.program_length_weeks ?? '—'} weeks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Equipment</span>
                <span className="text-white font-semibold capitalize text-right max-w-[60%]">
                  {preferences?.equipment?.map(e => e.replace(/_/g, ' ')).join(', ') ?? '—'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 py-3 rounded-lg text-sm font-semibold transition"
        >
          Sign Out
        </button>
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
              tab.path === '/profile' ? 'text-white' : 'text-zinc-600 hover:text-white'
            }`}
          >
            <span className="text-[10px] tracking-widest uppercase font-semibold">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
