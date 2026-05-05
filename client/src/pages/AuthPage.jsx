import { useState } from 'react'
import LoginForm from '../components/auth/LoginForm'
import SignupForm from '../components/auth/SignupForm'

export default function AuthPage() {
  const [mode, setMode] = useState('login')

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-10">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">FitForge</h1>
          <p className="text-zinc-500 text-sm mt-1">AI-powered training, built around you</p>
        </div>

        {/* Tab toggle */}
        <div className="flex border-b border-zinc-800 mb-8">
          <button
            onClick={() => setMode('login')}
            className={`pb-3 text-sm font-semibold mr-6 transition border-b-2 -mb-px
              ${mode === 'login' ? 'text-white border-white' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`pb-3 text-sm font-semibold transition border-b-2 -mb-px
              ${mode === 'signup' ? 'text-white border-white' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
          >
            Create Account
          </button>
        </div>

        {mode === 'login'
          ? <LoginForm onSwitch={() => setMode('signup')} />
          : <SignupForm onSwitch={() => setMode('login')} />
        }
      </div>
    </div>
  )
}
