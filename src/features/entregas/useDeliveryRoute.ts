import { useEffect, useMemo, useState } from 'react'
import { computeDeliveryRoute } from '@/lib/routing/computeRoute'
import type { RouteResult } from '@/lib/routing/types'
import type { CondominioEntregaGroup } from '@/features/entregas/groupByCondominio'

export function useDeliveryRoute(groups: CondominioEntregaGroup[]) {
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [missingCoordinates, setMissingCoordinates] = useState<string[]>([])

  const groupKey = useMemo(
    () =>
      groups
        .map((group) => `${group.condominioId}:${group.latitude}:${group.longitude}:${group.entregas.length}`)
        .join('|'),
    [groups],
  )

  useEffect(() => {
    if (groups.length === 0) {
      setRoute(null)
      setMissingCoordinates([])
      return
    }

    let cancelled = false

    async function loadRoute() {
      setLoading(true)
      setError(null)

      const condominios = groups
        .filter((group) => group.condominioId !== '__sem_condominio__')
        .map((group) => ({
          id: group.condominioId,
          nome: group.nome,
          endereco: group.endereco,
          latitude: group.latitude,
          longitude: group.longitude,
        }))

      if (condominios.length === 0) {
        setRoute(null)
        setLoading(false)
        return
      }

      try {
        const result = await computeDeliveryRoute(condominios)

        if (cancelled) return

        setRoute(result.route)
        setMissingCoordinates(result.missingCoordinates)

        if (!result.route) {
          setError('Não foi possível calcular a rota.')
        }
      } catch {
        if (!cancelled) {
          setError('Erro ao calcular rota.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadRoute()

    return () => {
      cancelled = true
    }
  }, [groupKey, groups])

  return { route, loading, error, missingCoordinates }
}
