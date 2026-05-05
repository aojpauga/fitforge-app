import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import ProgressBar from '../components/onboarding/ProgressBar'
import GoalStep from '../components/onboarding/GoalStep'
import PreferencesStep from '../components/onboarding/PreferencesStep'
import EquipmentStep from '../components/onboarding/EquipmentStep'

const TOTAL_STEPS = 3

export default function OnboardingPage() {
  const { user, savePreferences } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState('')
  const [prefs, setPrefs] = useState({
    days_per_week: 4,
    experience_level: '',
    program_length_weeks: 6,
  })
  const [equipment, setEquipment] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function canAdvance() {
    if (step === 1) return !!goal
    if (step === 2) return !!prefs.experience_level && !!prefs.days_per_week
    if (step === 3) return equipment.length > 0
    return false
  }

  async function handleFinish() {
    setSaving(true)
    setError('')

    const { error: goalError } = await supabase
      .from('goals')
      .insert({ user_id: user.id, type: goal })

    if (goalError) {
      setError('Failed to save goal. Please try again.')
      setSaving(false)
      return
    }

    const { error: prefError } = await savePreferences({ ...prefs, equipment })

    if (prefError) {
      setError('Failed to save preferences. Please try again.')
      setSaving(false)
      return
    }

    navigate('/dashboard')
  }

  function handleNext() {
    if (step < TOTAL_STEPS) setStep(s => s + 1)
    else handleFinish()
  }

  function handleBack() {
    if (step > 1) setStep(s => s - 1)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <p className="text-xs font-black tracking-widest uppercase text-zinc-600 mb-8">FitForge</p>

        <ProgressBar current={step} total={TOTAL_STEPS} />

        {step === 1 && <GoalStep value={goal} onChange={setGoal} />}
        {step === 2 && <PreferencesStep value={prefs} onChange={setPrefs} />}
        {step === 3 && <EquipmentStep value={equipment} onChange={setEquipment} />}

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        <div className="flex gap-3 mt-10">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white py-3 rounded-lg font-semibold text-sm transition"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance() || saving}
            className="flex-1 bg-white hover:bg-zinc-100 disabled:opacity-30 text-black font-bold py-3 rounded-lg text-sm tracking-wide transition"
          >
            {saving ? 'Saving...' : step === TOTAL_STEPS ? 'Get Started' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
