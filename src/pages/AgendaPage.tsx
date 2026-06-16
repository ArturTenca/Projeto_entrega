import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import {
  fetchPedidosAtivos,
  generateEntregasForWeek,
  getWeekMonday,
  groupPedidosByDia,
} from '@/features/agenda/api'
import { formatDisplayDate, shiftDate } from '@/lib/dates'
import type { PedidoComCliente } from '@/types/database'

export function AgendaPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekMonday(new Date()))
  const [pedidos, setPedidos] = useState<PedidoComCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await fetchPedidosAtivos()
    setPedidos(result.data)
    setError(result.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const dias = groupPedidosByDia(pedidos)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    setSuccess(null)

    const result = await generateEntregasForWeek(weekStart)

    setGenerating(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess(
      result.created > 0
        ? `${result.created} entrega(s) gerada(s) para esta semana.`
        : 'Nenhuma entrega nova — já existem para esta semana.',
    )
  }

  if (loading) {
    return <LoadingState message="Carregando agenda..." />
  }

  const weekEnd = shiftDate(weekStart, 5)

  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <h1 className="text-xl font-bold text-secondary">Agenda</h1>
        <p className="text-sm text-muted">
          Segunda a sábado — pedidos ativos da semana
        </p>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setWeekStart((current) => shiftDate(current, -7))}
          >
            ← Semana
          </Button>
          <div className="text-center text-sm text-muted">
            {formatDisplayDate(weekStart)} — {formatDisplayDate(weekEnd)}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setWeekStart((current) => shiftDate(current, 7))}
          >
            Semana →
          </Button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => setWeekStart(getWeekMonday(new Date()))}
        >
          Semana atual
        </Button>
      </header>

      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-sm text-success" role="status">
          {success}
        </p>
      ) : null}

      <Button fullWidth loading={generating} onClick={handleGenerate}>
        Gerar entregas da semana
      </Button>

      {pedidos.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhum pedido ativo"
            description="Cadastre pedidos na aba Pedidos para montar a agenda."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {dias.map((dia) => (
            <Card key={dia.dia} variant={dia.pedidos.length > 0 ? 'important' : 'default'}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-secondary">{dia.label}</h2>
                <Badge variant={dia.pedidos.length > 0 ? 'primary' : 'default'}>
                  {dia.pedidos.length} pedidos · {dia.totalOvos} itens
                </Badge>
              </div>

              {dia.pedidos.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Sem entregas neste dia</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {dia.pedidos.map((pedido) => (
                    <li
                      key={pedido.id}
                      className="flex items-center justify-between gap-2 border-t border-border pt-2 first:border-t-0 first:pt-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-secondary">
                          {pedido.clientes.nome}
                        </p>
                        <p className="text-xs text-muted">
                          {pedido.clientes.condominios?.nome ?? 'Sem condomínio'} ·{' '}
                          {pedido.produtos?.nome ?? 'Item'} · {pedido.quantidade}{' '}
                          un.
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
