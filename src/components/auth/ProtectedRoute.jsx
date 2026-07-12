import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cx-void">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl border-2 border-cx-accent/30 border-t-cx-accent animate-spin" />
          <p className="text-xs text-cx-fg-dim uppercase tracking-widest">Loading TCS AI Engineering Studio…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cx-void">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-cx-accent/30 border-t-cx-accent animate-spin" />
          <p className="text-xs text-cx-fg-dim">Loading…</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}
