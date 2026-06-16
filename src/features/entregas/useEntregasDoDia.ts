import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchEntregasByDate } from '@/features/entregas/api'
import {
  getDeliveryDayStats,
  groupEntregasByCondominio,
} from '@/features/entregas/groupByCondominio'
import type { EntregaComDetalhes } from '@/types/database'

export function useEntregasDoDia(dateIso: string) {
  const [entregas, setEntregas] = useState<EntregaComDetalhes[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await fetchEntregasByDate(dateIso)

    setEntregas(result.data)
    setError(result.error)
    setLoading(false)
  }, [dateIso])

  useEffect(() => {
    void load()
  }, [load])

  const groups = useMemo(
    () => groupEntregasByCondominio(entregas),
    [entregas],
  )
  const stats = useMemo(() => getDeliveryDayStats(entregas), [entregas])

  return {
    entregas,
    groups,
    stats,
    loading,
    error,
    reload: load,
  }
}
