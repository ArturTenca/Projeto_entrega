import { useCallback, useEffect, useMemo, useState } from 'react'
import { MonthCalendar } from '@/components/agenda/MonthCalendar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { Modal } from '@/components/ui/Modal'
import {
  generateEntregasForWeek,
  getWeekMonday,
} from '@/features/agenda/api'
import { fetchEntregasByRange } from '@/features/entregas/api'
import { statusColor } from '@/features/entregas/groupByCondominio'
import {
  formatDisplayDate,
  getMonthGrid,
  startOfMonth,
  toDateISO,
} from '@/lib/dates'
import { formatPhone } from '@/lib/format/phone'
import type { EntregaComDetalhes } from '@/types/database'
import { ENTREGA_STATUS_LABEL } from '@/types/database'

export function AgendaPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [entregas, setEntregas] = useState<EntregaComDetalhes[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const cells = getMonthGrid(month)
    const gridStart = toDateISO(cells[0]!.date)
    const gridEnd = toDateISO(cells[cells.length - 1]!.date)

    const result = await fetchEntregasByRange(gridStart, gridEnd)
    setEntregas(result.data)
    setError(result.error)
    setLoading(false)
  }, [month])

  useEffect(() => {
    void load()
  }, [load])

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const entrega of entregas) {
      map[entrega.data_prevista] = (map[entrega.data_prevista] ?? 0) + 1
    }
    return map
  }, [entregas])

  const selectedIso = toDateISO(selectedDate)
  const dayEntregas = useMemo(
    () => entregas.filter((entrega) => entrega.data_prevista === selectedIso),
    [entregas, selectedIso],
  )

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    setSuccess(null)

    const result = await generateEntregasForWeek(getWeekMonday(selectedDate))
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
    await load()
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date)
    if (date.getMonth() !== month.getMonth()) {
      setMonth(startOfMonth(date))
    }
    setDetailsOpen(true)
  }

  if (loading) {
    return <LoadingState message="Carregando calendário..." />
  }

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="page-title">Agenda</h1>
        <p className="text-center text-sm text-muted">
          Toque em um dia para ver as entregas.
        </p>
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

      <Card variant="important">
        <MonthCalendar
          month={month}
          selectedDate={selectedDate}
          counts={counts}
          onMonthChange={setMonth}
          onSelectDate={handleSelectDate}
        />
      </Card>

      <Button
        variant="secondary"
        size="sm"
        fullWidth
        onClick={() => {
          const today = new Date()
          setMonth(startOfMonth(today))
          setSelectedDate(today)
        }}
      >
        Hoje
      </Button>

      <Button fullWidth loading={generating} onClick={() => void handleGenerate()}>
        Gerar entregas da semana
      </Button>

      <Modal
        open={detailsOpen}
        title={formatDisplayDate(selectedDate)}
        onClose={() => setDetailsOpen(false)}
      >
        {dayEntregas.length === 0 ? (
          <EmptyState
            title="Nenhuma entrega neste dia"
            description="Gere as entregas da semana ou escolha outro dia."
          />
        ) : (
          <ul className="space-y-3">
            {dayEntregas.map((entrega) => {
              const cliente = entrega.pedidos.clientes
              const condominio = cliente.condominios

              return (
                <li
                  key={entrega.id}
                  className="rounded-[var(--radius-card)] border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-secondary">
                        {cliente.nome}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">
                        {condominio?.nome ?? 'Sem condomínio'}
                      </p>
                    </div>
                    <span
                      className={[
                        'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                        statusColor(entrega.status),
                      ].join(' ')}
                    >
                      {ENTREGA_STATUS_LABEL[entrega.status]}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-secondary">
                    {entrega.pedidos.produtos?.nome ?? 'Item'} ·{' '}
                    {entrega.quantidade} un.
                  </p>

                  {condominio?.endereco || cliente.endereco ? (
                    <p className="mt-1 text-xs text-muted">
                      {condominio?.endereco ?? cliente.endereco}
                    </p>
                  ) : null}

                  {cliente.telefone ? (
                    <p className="mt-1 text-xs text-muted">
                      {formatPhone(cliente.telefone)}
                    </p>
                  ) : null}

                  {entrega.observacoes ? (
                    <p className="mt-2 text-xs text-muted">
                      {entrega.observacoes}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}

        <div className="mt-4">
          <Badge variant="primary">{dayEntregas.length} entrega(s)</Badge>
        </div>
      </Modal>
    </div>
  )
}
