import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, totpCode?: string) => Promise<{
    requiresTwoFactor?: boolean
    tempToken?: string
  }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthCtx = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setUser(null)
      return
    }
    try {
      const me = await api.auth.me()
      setUser(me)
    } catch {
      setUser(null)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false))
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string, totpCode?: string) => {
    const result = await api.auth.login(email, password, totpCode)
    if (result.accessToken) {
      const me = await api.auth.me()
      setUser(me)
    }
    return {
      requiresTwoFactor: result.requiresTwoFactor,
      tempToken: result.tempToken,
    }
  }, [])

  const logout = useCallback(async () => {
    await api.auth.logout()
    setUser(null)
  }, [])

  return (
    <AuthCtx.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
