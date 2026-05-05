import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [preferences, setPreferences] = useState(null)
  const [goal, setGoal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setPreferences(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const [{ data: profileData }, { data: prefsData }, { data: goalData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_preferences').select('*').eq('user_id', userId).single(),
      supabase.from('goals').select('type').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    setProfile(profileData)
    setPreferences(prefsData)
    setGoal(goalData?.type ?? null)
    setLoading(false)
  }

  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    return { data, error }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function savePreferences(prefs) {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id, ...prefs, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (!error) setPreferences(data)
    return { data, error }
  }

  async function saveGoal(type) {
    const { data, error } = await supabase
      .from('goals')
      .insert({ user_id: user.id, type })
      .select()
      .single()
    if (!error) setGoal(type)
    return { data, error }
  }

  // True if the user has completed onboarding
  const isOnboarded = !!preferences

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      preferences,
      goal,
      loading,
      isOnboarded,
      signUp,
      signIn,
      signOut,
      savePreferences,
      saveGoal,
      refreshProfile: () => user && fetchProfile(user.id),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
