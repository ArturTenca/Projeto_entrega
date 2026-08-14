import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { DatabaseUnavailable } from '@/components/ui/DatabaseUnavailable'
import { LoadingState } from '@/components/ui/LoadingState'
import {
  checkDatabaseAvailability,
  isSupabaseConfigured,
} from '@/lib/supabase'

export function DatabaseGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>(
    isSupabaseConfigured ? 'checking' : 'error',
  )
  const [retrying, setRetrying] = useState(false)

  const verify = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setRetrying(true)
    } else {
      setStatus('checking')
    }

    const result = await checkDatabaseAvailability()

    setStatus(result.available ? 'ok' : 'error')
    setRetrying(false)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    void verify()
  }, [verify])

  if (status === 'checking') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <LoadingState message="Conectando ao banco de dados..." />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <DatabaseUnavailable
        onRetry={() => {
          void verify(true)
        }}
        retrying={retrying}
      />
    )
  }

  return children
}
