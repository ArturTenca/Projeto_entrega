import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '@/components/ui/LoadingState'
import { useAuth } from '@/features/auth/AuthProvider'
import { getSafeInternalPath } from '@/lib/security/paths'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingState message="Verificando sessão..." />
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: getSafeInternalPath(location.pathname) }}
      />
    )
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const from = getSafeInternalPath(
    (location.state as { from?: string } | null)?.from,
  )

  if (loading) {
    return <LoadingState message="Verificando sessão..." />
  }

  if (session) {
    return <Navigate to={from} replace />
  }

  return <Outlet />
}
