import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { validateLoginCredentials } from '@/lib/security/validateLogin'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function initSession() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error('Erro ao validar sessão')
          setSession(null)
        } else {
          setSession(data.session)
        }
      } catch {
        if (!mounted) return
        console.error('Erro ao validar sessão')
        setSession(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void initSession()

    let subscription: { unsubscribe: () => void } | null = null

    try {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!mounted) return
        setSession(nextSession)
        setLoading(false)
      })
      subscription = authSubscription
    } catch {
      console.error('Erro ao observar sessão')
    }

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const validation = validateLoginCredentials(email, password)

    if (!validation.ok) {
      return { error: validation.error }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: validation.email,
        password: validation.password,
      })

      if (error) {
        return { error: 'Email ou senha inválidos.' }
      }

      return { error: null }
    } catch {
      return {
        error:
          'Não foi possível conectar ao banco de dados. Tente novamente mais tarde.',
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Erro ao encerrar sessão')
      }
    } catch {
      console.error('Erro ao encerrar sessão')
    }

    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signIn,
      signOut,
    }),
    [session, loading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }

  return context
}
