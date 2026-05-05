import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginForm() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(form.email, form.password)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-2">Email</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition text-sm"
          placeholder="you@email.com"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-2">Password</label>
        <input
          type="password"
          required
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition text-sm"
          placeholder="••••••••"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white hover:bg-zinc-100 disabled:opacity-40 text-black font-bold py-3 rounded-lg transition text-sm tracking-wide mt-1"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}
