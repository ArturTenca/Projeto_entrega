import { useEffect, useMemo, useState } from 'react'
import { ArrowButton } from '@/components/ui/ArrowButton'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { Select } from '@/components/ui/Select'
import { Tabs } from '@/components/ui/Tabs'
import { fetchClientes } from '@/features/clientes/api'
import {
  fetchEntregasFinanceiro,
  type EntregaFinanceira,
} from '@/features/financeiro/api'
import {
  computeFinanceiro,
  type MesResumo,
  type RankingItem,
} from '@/features/financeiro/computeFinanceiro'
import { ProdutosDonut } from '@/features/financeiro/ProdutosDonut'
import { fetchProdutos } from '@/features/produtos/api'
import { addMonths, formatMonthYear, startOfMonth, toDateISO } from '@/lib/dates'
import { formatBRL } from '@/lib/format/currency'

const HISTORICO_MESES = 6
const TOP_LIMIT = 5

type Metrica = 'faturado' | 'gasto' | 'lucro'

const METRICAS: Array<{ id: Metrica; label: string }> = [
  { id: 'faturado', label: 'Faturado' },
  { id: 'gasto', label: 'Gasto' },
  { id: 'lucro', label: 'Lucro' },
]

interface Option {
  value: string
  label: string
}

function monthKey(date: Date): string {
  return toDateISO(date).slice(0, 7)
}

function shortMonth(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(year!, month! - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'short' })
    .replace('.', '')
}

function formatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

export function FinanceiroPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [clienteId, setClienteId] = useState('')
  const [produtoId, setProdutoId] = useState('')
  const [metrica, setMetrica] = useState<Metrica>('faturado')
  const [entregas, setEntregas] = useState<EntregaFinanceira[]>([])
  const [clienteOptions, setClienteOptions] = useState<Option[]>([])
  const [produtoOptions, setProdutoOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const meses = useMemo(
    () =>
      Array.from({ length: HISTORICO_MESES }, (_, index) =>
        monthKey(addMonths(month, index - (HISTORICO_MESES - 1))),
      ),
    [month],
  )

  useEffect(() => {
    void (async () => {
      const [clientes, produtos] = await Promise.all([
        fetchClientes(),
        fetchProdutos(),
      ])
      setClienteOptions(
        clientes.data.map((cliente) => ({ value: cliente.id, label: cliente.nome })),
      )
      setProdutoOptions(
        produtos.data.map((produto) => ({ value: produto.id, label: produto.nome })),
      )
    })()
  }, [])

  useEffect(() => {
    let cancelled = false
    const start = toDateISO(addMonths(month, -(HISTORICO_MESES - 1)))
    const end = toDateISO(new Date(month.getFullYear(), month.getMonth() + 1, 0))

    setLoading(true)
    void fetchEntregasFinanceiro(start, end).then((result) => {
      if (cancelled) return
      setEntregas(result.data)
      setError(result.error)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [month])

  const resumo = useMemo(
    () =>
      computeFinanceiro(entregas, monthKey(month), meses, {
        clienteId,
        produtoId,
      }),
    [entregas, month, meses, clienteId, produtoId],
  )

  const produtoColorIndex = useMemo(
    () => new Map(produtoOptions.map((option, index) => [option.value, index])),
    [produtoOptions],
  )

  const { totais } = resumo
  const margem = totais.faturado > 0 ? (totais.lucro / totais.faturado) * 100 : 0
  const hasFilters = Boolean(clienteId || produtoId)

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="page-title">Financeiro</h1>
        <p className="text-center text-sm text-muted">
          Calculado sobre as entregas concluídas.
        </p>
      </header>

      <div className="flex items-center justify-between gap-2">
        <ArrowButton
          direction="left"
          aria-label="Mês anterior"
          onClick={() => setMonth((current) => addMonths(current, -1))}
        />
        <p className="min-w-0 flex-1 truncate text-center font-semibold capitalize text-secondary">
          {formatMonthYear(month)}
        </p>
        <ArrowButton
          direction="right"
          aria-label="Próximo mês"
          onClick={() => setMonth((current) => addMonths(current, 1))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Cliente"
          placeholder="Todos"
          options={clienteOptions}
          value={clienteId}
          onChange={(event) => setClienteId(event.target.value)}
        />
        <Select
          label="Produto"
          placeholder="Todos"
          options={produtoOptions}
          value={produtoId}
          onChange={(event) => setProdutoId(event.target.value)}
        />
      </div>

      {hasFilters ? (
        <button
          type="button"
          className="w-full text-center text-sm font-medium text-primary"
          onClick={() => {
            setClienteId('')
            setProdutoId('')
          }}
        >
          Limpar filtros
        </button>
      ) : null}

      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <LoadingState message="Carregando financeiro..." />
      ) : (
        <>
          <Card variant="important">
            <p className="text-sm text-muted">Lucro</p>
            <p
              className={[
                'mt-1 text-3xl font-extrabold',
                totais.lucro >= 0 ? 'text-success' : 'text-error',
              ].join(' ')}
            >
              {formatBRL(totais.lucro)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Margem de {formatPercent(margem)}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted">Faturado</p>
                <p className="text-lg font-bold text-secondary">
                  {formatBRL(totais.faturado)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Gasto</p>
                <p className="text-lg font-bold text-secondary">
                  {formatBRL(totais.gasto)}
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <p className="text-sm text-muted">Entregas feitas</p>
              <p className="mt-1 text-2xl font-bold text-secondary">
                {totais.entregas}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-muted">Itens vendidos</p>
              <p className="mt-1 text-2xl font-bold text-secondary">
                {totais.itens}
              </p>
            </Card>
          </div>

          <Card variant="important" className="space-y-4">
            <h2 className="section-title">Últimos {HISTORICO_MESES} meses</h2>
            <Tabs
              tabs={METRICAS}
              active={metrica}
              onChange={(id) => setMetrica(id as Metrica)}
            />
            <HistoricoChart
              historico={resumo.historico}
              metrica={metrica}
              selectedKey={monthKey(month)}
            />
          </Card>

          {totais.entregas === 0 ? (
            <Card>
              <EmptyState
                title="Nenhuma entrega concluída"
                description={
                  hasFilters
                    ? 'Nada encontrado com esses filtros neste mês.'
                    : 'Marque entregas como entregues para ver o financeiro do mês.'
                }
              />
            </Card>
          ) : (
            <>
              <Card variant="important">
                <h2 className="section-title mb-4">Itens mais vendidos</h2>
                <ProdutosDonut
                  items={resumo.produtos}
                  colorIndexById={produtoColorIndex}
                />
              </Card>
              <RankingCard
                title="Clientes que mais compram"
                items={resumo.clientes}
                value={(item) => item.faturado}
                primary={(item) => formatBRL(item.faturado)}
                secondary={(item) => `Lucro ${formatBRL(item.lucro)}`}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}

interface HistoricoChartProps {
  historico: MesResumo[]
  metrica: Metrica
  selectedKey: string
}

function HistoricoChart({ historico, metrica, selectedKey }: HistoricoChartProps) {
  const [activeKey, setActiveKey] = useState(selectedKey)

  useEffect(() => {
    setActiveKey(selectedKey)
  }, [selectedKey])

  const values = historico.map((mes) => mes[metrica])
  const max = Math.max(...values.map(Math.abs), 1)
  const hasNegative = values.some((value) => value < 0)
  const active = historico.find((mes) => mes.key === activeKey) ?? historico.at(-1)

  return (
    <div>
      {active ? (
        <p className="text-center text-sm text-muted">
          <span className="capitalize">{shortMonth(active.key)}</span>:{' '}
          <span className="font-semibold text-secondary">
            {formatBRL(active[metrica])}
          </span>
        </p>
      ) : null}

      <div
        className="mt-3 flex h-40 items-stretch gap-2"
        role="list"
        aria-label={`${metrica} por mês`}
      >
        {historico.map((mes) => {
          const value = mes[metrica]
          const pct = (Math.abs(value) / max) * (hasNegative ? 50 : 100)
          const isActive = mes.key === activeKey

          return (
            <button
              key={mes.key}
              type="button"
              role="listitem"
              aria-label={`${shortMonth(mes.key)}: ${formatBRL(value)}`}
              onClick={() => setActiveKey(mes.key)}
              onMouseEnter={() => setActiveKey(mes.key)}
              className="relative flex min-w-0 flex-1 flex-col"
            >
              <div
                className={[
                  'relative w-full',
                  hasNegative ? 'h-1/2 border-b border-border' : 'h-full',
                ].join(' ')}
              >
                {value > 0 ? (
                  <div
                    className={[
                      'absolute bottom-0 left-1/2 w-full max-w-8 -translate-x-1/2 rounded-t-[4px] transition-all duration-300',
                      isActive ? 'bg-primary' : 'bg-primary/35',
                    ].join(' ')}
                    style={{ height: `${hasNegative ? pct * 2 : pct}%` }}
                  />
                ) : null}
              </div>
              {hasNegative ? (
                <div className="relative h-1/2 w-full">
                  {value < 0 ? (
                    <div
                      className={[
                        'absolute left-1/2 top-0 w-full max-w-8 -translate-x-1/2 rounded-b-[4px] transition-all duration-300',
                        isActive ? 'bg-error' : 'bg-error/35',
                      ].join(' ')}
                      style={{ height: `${pct * 2}%` }}
                    />
                  ) : null}
                </div>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex gap-2 border-t border-border pt-2">
        {historico.map((mes) => (
          <span
            key={mes.key}
            className={[
              'min-w-0 flex-1 text-center text-[11px] capitalize',
              mes.key === activeKey ? 'font-semibold text-secondary' : 'text-muted',
            ].join(' ')}
          >
            {shortMonth(mes.key)}
          </span>
        ))}
      </div>
    </div>
  )
}

interface RankingCardProps {
  title: string
  items: RankingItem[]
  value: (item: RankingItem) => number
  primary: (item: RankingItem) => string
  secondary: (item: RankingItem) => string
}

function RankingCard({ title, items, value, primary, secondary }: RankingCardProps) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? items : items.slice(0, TOP_LIMIT)
  const max = Math.max(...items.map(value), 1)

  return (
    <Card variant="important">
      <h2 className="section-title">{title}</h2>

      <ol className="mt-4 space-y-4">
        {visible.map((item, index) => (
          <li key={item.id}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium text-secondary">
                <span className="mr-2 text-muted">{index + 1}.</span>
                {item.nome}
              </p>
              <p className="shrink-0 text-sm font-semibold text-secondary">
                {primary(item)}
              </p>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary/5">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${(Math.max(value(item), 0) / max) * 100}%` }}
                />
              </div>
              <p className="shrink-0 text-xs text-muted">{secondary(item)}</p>
            </div>
          </li>
        ))}
      </ol>

      {items.length > TOP_LIMIT ? (
        <button
          type="button"
          className="mt-4 w-full text-center text-sm font-medium text-primary"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Ver menos' : `Ver todos (${items.length})`}
        </button>
      ) : null}
    </Card>
  )
}
