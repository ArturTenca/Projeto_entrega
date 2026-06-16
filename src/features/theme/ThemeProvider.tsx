import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { fetchUserTheme, updateUserTheme } from '@/features/theme/api'
import {
  applyThemeToDocument,
  readCachedTheme,
  writeCachedTheme,
} from '@/features/theme/storage'
import type { ThemeMode } from '@/types/database'

interface ThemeContextValue {
  theme: ThemeMode
  loading: boolean
  setTheme: (theme: ThemeMode) => Promise<void>
  toggleTheme: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [theme, setThemeState] = useState<ThemeMode>(
    () => readCachedTheme() ?? 'light',
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    applyThemeToDocument(theme)
  }, [theme])

  useEffect(() => {
    if (!user) {
      const fallback = readCachedTheme() ?? 'light'
      setThemeState(fallback)
      applyThemeToDocument(fallback)
      setLoading(false)
      return
    }

    let cancelled = false

    const userId = user.id

    async function loadTheme() {
      setLoading(true)
      const result = await fetchUserTheme(userId)

      if (cancelled) return

      const resolved = result.theme
      setThemeState(resolved)
      writeCachedTheme(resolved)
      applyThemeToDocument(resolved)
      setLoading(false)
    }

    void loadTheme()

    return () => {
      cancelled = true
    }
  }, [user])

  const setTheme = useCallback(
    async (next: ThemeMode) => {
      setThemeState(next)
      writeCachedTheme(next)
      applyThemeToDocument(next)

      if (!user) return

      await updateUserTheme(user.id, next)
    },
    [user],
  )

  const toggleTheme = useCallback(async () => {
    await setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  const value = useMemo(
    () => ({
      theme,
      loading,
      setTheme,
      toggleTheme,
    }),
    [theme, loading, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  }

  return context
}
