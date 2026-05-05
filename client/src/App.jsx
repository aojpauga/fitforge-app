import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import WorkoutPage from './pages/WorkoutPage'
import ProgressPage from './pages/ProgressPage'
import ProfilePage from './pages/ProfilePage'

// Redirects unauthenticated users to /auth
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  return children
}

// Redirects authenticated + onboarded users away from onboarding
function OnboardingRoute({ children }) {
  const { user, loading, isOnboarded } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  if (isOnboarded) return <Navigate to="/dashboard" replace />
  return children
}

// Redirects logged-in users away from the auth page
function PublicRoute({ children }) {
  const { user, loading, isOnboarded } = useAuth()
  if (loading) return <LoadingScreen />
  if (user && !isOnboarded) return <Navigate to="/onboarding" replace />
  if (user && isOnboarded) return <Navigate to="/dashboard" replace />
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />

      <Route path="/auth" element={
        <PublicRoute>
          <AuthPage />
        </PublicRoute>
      } />

      <Route path="/onboarding" element={
        <OnboardingRoute>
          <OnboardingPage />
        </OnboardingRoute>
      } />

      <Route path="/dashboard" element={
        <PrivateRoute>
          <DashboardPage />
        </PrivateRoute>
      } />

      <Route path="/workout/:dayId" element={
        <PrivateRoute>
          <WorkoutPage />
        </PrivateRoute>
      } />

      <Route path="/progress" element={
        <PrivateRoute>
          <ProgressPage />
        </PrivateRoute>
      } />

      <Route path="/profile" element={
        <PrivateRoute>
          <ProfilePage />
        </PrivateRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
