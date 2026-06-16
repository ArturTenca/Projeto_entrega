import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { CondominioCapsule } from '@/components/entregas/CondominioCapsule'
import { DateSelector } from '@/components/entregas/DateSelector'
import { DeliveryMap } from '@/components/entregas/DeliveryMap'
import { RouteSummary } from '@/components/entregas/RouteSummary'
import { sortGroupsByRouteOrder } from '@/features/entregas/groupByCondominio'
import { useDeliveryRoute } from '@/features/entregas/useDeliveryRoute'
import { useEntregasDoDia } from '@/features/entregas/useEntregasDoDia'
import { toDateISO } from '@/lib/dates'

export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [selectedCondominioId, setSelectedCondominioId] = useState<string | null>(
    null,
  )

  const dateIso = toDateISO(selectedDate)
  const { entregas, groups, stats, loading, error } = useEntregasDoDia(dateIso)
  const { route, loading: routeLoading, error: routeError, missingCoordinates } =
    useDeliveryRoute(groups)

  const orderedGroups = useMemo(() => {
    if (!route) return groups
    return sortGroupsByRouteOrder(
      groups,
      route.stops.map((stop) => stop.id),
    )
  }, [groups, route])

  const ordemMap = useMemo(
    () => new Map(route?.stops.map((stop) => [stop.id, stop.ordem]) ?? []),
    [route],
  )

  if (loading) {
    return <LoadingState message="Carregando entregas do dia..." />
  }

  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <DateSelector date={selectedDate} onChange={setSelectedDate} />
        <h1 className="text-xl font-bold text-secondary">Entrega do dia</h1>
        <p className="text-sm text-muted">
          Todos os usuários veem os mesmos pedidos e entregas.
        </p>
      </header>

      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-muted">Entregas</p>
          <p className="mt-1 text-2xl font-bold text-secondary">{stats.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Pendentes</p>
          <p className="mt-1 text-2xl font-bold text-warning">
            {stats.pendentes}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Condomínios</p>
          <p className="mt-1 text-2xl font-bold text-secondary">
            {stats.condominios}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Total de itens</p>
          <p className="mt-1 text-2xl font-bold text-secondary">
            {stats.totalOvos}
          </p>
        </Card>
      </div>

      {entregas.length === 0 ? (
        <Card variant="important">
          <EmptyState
            title="Nenhuma entrega neste dia"
            description="Cadastre pedidos e gere entregas na agenda. Tudo que qualquer usuário criar aparecerá aqui para todos."
          />
        </Card>
      ) : (
        <>
          <RouteSummary
            route={route}
            loading={routeLoading}
            error={routeError}
            missingCoordinates={missingCoordinates}
          />

          <DeliveryMap
            route={route}
            selectedStopId={selectedCondominioId}
          />

          <section className="space-y-3">
            <h2 className="font-semibold text-secondary">
              Condomínios ({orderedGroups.length})
            </h2>

            {orderedGroups.map((group) => (
              <CondominioCapsule
                key={group.condominioId}
                group={group}
                ordem={ordemMap.get(group.condominioId)}
                selected={selectedCondominioId === group.condominioId}
                onSelect={() =>
                  setSelectedCondominioId((current) =>
                    current === group.condominioId ? null : group.condominioId,
                  )
                }
              />
            ))}
          </section>
        </>
      )}
    </div>
  )
}
