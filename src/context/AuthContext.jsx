import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getStoredAuth,
  validateSession,
  loginWithCredentials,
  logout as authLogout,
} from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const valid = await validateSession()
      setSession(valid)
    } catch (err) {
      console.error('Session validation failed:', err)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const handler = () => {
      setSession(getStoredAuth())
    }
    window.addEventListener('horizon-auth', handler)
    return () => window.removeEventListener('horizon-auth', handler)
  }, [refresh])

  const login = useCallback(async (username, password, remember) => {
    const result = await loginWithCredentials(username, password, remember)
    if (result.ok) setSession(result.session)
    return result
  }, [])

  const logout = useCallback(() => {
    authLogout()
    setSession(null)
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    accessToken: session?.accessToken ?? null,
    isAuthenticated: !!session?.accessToken,
    loading,
    login,
    logout,
    refresh,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
