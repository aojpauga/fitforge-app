import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const API = import.meta.env.VITE_API_URL

async function apiFetch(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

const FEELING_LABELS = { 1: 'Rough', 2: 'Hard', 3: 'Solid', 4: 'Great', 5: 'Beast' }

function StatCard({ label, value }) {
  return (
    <div className="border border-zinc-900 bg-zinc-950 rounded-lg p-3 text-center">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-zinc-600 text-xs mt-0.5 tracking-wide uppercase">{label}</p>
    </div>
  )
}

export default function ProgressPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [volume, setVolume] = useState([])
  const [prs, setPrs] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      const t = session.access_token
      Promise.all([
        apiFetch('/api/stats/summary', t),
        apiFetch('/api/stats/volume', t),
        apiFetch('/api/stats/prs', t),
        apiFetch('/api/stats/history', t),
      ]).then(([s, v, p, h]) => {
        setSummary(s)
        setVolume(v.weeks.map(w => ({
          week: w.week.slice(5),   // "MM-DD"
          volume: w.volume,
        })))
        setPrs(p.prs)
        setHistory(h.history)
      }).catch(() => {}).finally(() => setLoading(false))
    })
  }, [user])

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
        <span className="text-sm font-black tracking-widest uppercase text-white">FitForge</span>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8">
        <h1 className="text-2xl font-black tracking-tight uppercase mb-6">Progress</h1>

        {loading ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-zinc-950 border border-zinc-900 rounded-lg" />)}
            </div>
            <div className="h-48 bg-zinc-950 border border-zinc-900 rounded-lg" />
            <div className="h-32 bg-zinc-950 border border-zinc-900 rounded-lg" />
            <div className="h-32 bg-zinc-950 border border-zinc-900 rounded-lg" />
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard label="Total" value={summary?.total ?? 0} />
              <StatCard label="This Week" value={summary?.this_week ?? 0} />
              <StatCard label="Streak" value={`${summary?.streak ?? 0}d`} />
            </div>

            {/* Volume chart */}
            <div className="border border-zinc-900 bg-zinc-950 rounded-lg p-5 mb-4">
              <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Weekly Volume (lbs)</p>
              {volume.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-6">No data yet — log a workout to start tracking.</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={volume} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 6 }}
                      labelStyle={{ color: '#a1a1aa', fontSize: 11 }}
                      itemStyle={{ color: '#fff', fontSize: 12 }}
                      formatter={v => [`${v.toLocaleString()} lbs`, 'Volume']}
                    />
                    <Bar dataKey="volume" fill="#ffffff" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Personal records */}
            {prs.length > 0 && (
              <div className="border border-zinc-900 bg-zinc-950 rounded-lg p-5 mb-4">
                <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Top Lifts (est. 1RM)</p>
                <div className="flex flex-col gap-3">
                  {prs.map((pr, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white font-medium">{pr.name}</p>
                        <p className="text-xs text-zinc-600">{pr.weight} lbs × {pr.reps} reps</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white">{pr.e1rm} lbs</p>
                        <p className="text-xs text-zinc-600">est. 1RM</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent sessions */}
            <div className="border border-zinc-900 bg-zinc-950 rounded-lg p-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Recent Sessions</p>
              {history.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-4">No sessions logged yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {history.map(log => (
                    <div key={log.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white font-medium">
                          {log.program_days?.label ?? 'Workout'}
                        </p>
                        <p className="text-xs text-zinc-600">{log.date}</p>
                      </div>
                      <div className="text-right">
                        {log.overall_feeling && (
                          <p className="text-xs font-semibold text-zinc-400">
                            {FEELING_LABELS[log.overall_feeling]}
                          </p>
                        )}
                        {log.duration_mins > 0 && (
                          <p className="text-xs text-zinc-600">{log.duration_mins} min</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
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
              tab.path === '/progress' ? 'text-white' : 'text-zinc-600 hover:text-white'
            }`}
          >
            <span className="text-[10px] tracking-widest uppercase font-semibold">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
