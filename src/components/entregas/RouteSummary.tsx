import { formatDistance, formatDuration } from '@/lib/routing/distance'
import type { RouteResult } from '@/lib/routing/types'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/LoadingState'

interface RouteSummaryProps {
  route: RouteResult | null
  loading: boolean
  error: string | null
  missingCoordinates: string[]
}

function providerLabel(route: RouteResult): string {
  if (route.provider === 'google' && route.trafficAware) {
    return 'Google Maps · com trânsito'
  }

  if (route.provider === 'openrouteservice') {
    return 'OpenRouteService · rota mais curta'
  }

  return 'Estimativa · linha reta'
}

export function RouteSummary({
  route,
  loading,
  error,
  missingCoordinates,
}: RouteSummaryProps) {
  if (loading) {
    return (
      <Card>
        <LoadingState message="Calculando rota..." />
      </Card>
    )
  }

  return (
    <Card variant="important">
      <h2 className="font-semibold text-secondary">Rota do dia</h2>

      {error ? (
        <p className="mt-2 text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      {route ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted">Distância</p>
            <p className="text-lg font-bold text-secondary">
              {formatDistance(route.distanceMeters)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Tempo estimado</p>
            <p className="text-lg font-bold text-secondary">
              {formatDuration(route.durationSeconds)}
            </p>
          </div>
        </div>
      ) : null}

      {route ? (
        <p className="mt-3 text-xs text-muted">{providerLabel(route)}</p>
      ) : null}

      {missingCoordinates.length > 0 ? (
        <p className="mt-3 text-xs text-warning">
          Sem localização: {missingCoordinates.join(', ')}. Cadastre o endereço
          do condomínio para incluir no mapa.
        </p>
      ) : null}

      <p className="mt-2 text-xs text-muted">
        Waze não possui API pública. Use o botão Waze em cada condomínio para
        navegação com trânsito em tempo real.
      </p>
    </Card>
  )
}
