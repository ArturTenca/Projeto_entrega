import { useEffect, useMemo, useState } from 'react'
import { formatBRL } from '@/lib/format/currency'
import type { RankingItem } from './computeFinanceiro'

const SERIES_COUNT = 8
const MAX_SLICES = 5
const OUTROS_ID = 'outros'

const SIZE = 200
const RADIUS = 78
const STROKE = 22
const STROKE_ACTIVE = 30
const GAP = 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface Slice extends RankingItem {
  color: string
  share: number
}

interface ProdutosDonutProps {
  items: RankingItem[]
  /** Posição fixa de cada produto na paleta: a cor segue o produto, não o ranking. */
  colorIndexById: Map<string, number>
}

function seriesColor(index: number | undefined): string {
  if (index === undefined || index >= SERIES_COUNT) {
    return 'var(--color-series-other)'
  }
  return `var(--color-series-${index + 1})`
}

function formatShare(share: number): string {
  return `${(share * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

function buildSlices(
  items: RankingItem[],
  colorIndexById: Map<string, number>,
): Slice[] {
  const total = items.reduce((sum, item) => sum + item.quantidade, 0)
  if (total === 0) return []

  const fitsAll = items.length <= MAX_SLICES + 1
  const principais = fitsAll ? items : items.slice(0, MAX_SLICES)
  const resto = fitsAll ? [] : items.slice(MAX_SLICES)

  const slices: Slice[] = principais.map((item) => ({
    ...item,
    color: seriesColor(colorIndexById.get(item.id)),
    share: item.quantidade / total,
  }))

  if (resto.length > 0) {
    const outros = resto.reduce(
      (acc, item) => ({
        ...acc,
        quantidade: acc.quantidade + item.quantidade,
        faturado: acc.faturado + item.faturado,
        lucro: acc.lucro + item.lucro,
      }),
      { id: OUTROS_ID, nome: `Outros (${resto.length})`, quantidade: 0, faturado: 0, lucro: 0 },
    )
    slices.push({
      ...outros,
      color: 'var(--color-series-other)',
      share: outros.quantidade / total,
    })
  }

  return slices
}

export function ProdutosDonut({ items, colorIndexById }: ProdutosDonutProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [drawn, setDrawn] = useState(false)

  const slices = useMemo(
    () => buildSlices(items, colorIndexById),
    [items, colorIndexById],
  )
  const totalItens = slices.reduce((sum, slice) => sum + slice.quantidade, 0)
  const active = slices.find((slice) => slice.id === activeId) ?? null

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    setActiveId(null)
  }, [items])

  function toggle(id: string) {
    setActiveId((current) => (current === id ? null : id))
  }

  let offset = 0
  const gap = slices.length > 1 ? GAP : 0

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-full max-w-[220px]">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="block h-auto w-full overflow-visible"
          role="img"
          aria-label="Participação de cada produto nos itens vendidos"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-secondary/5"
          />
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {slices.map((slice) => {
              const length = slice.share * CIRCUMFERENCE
              const visible = Math.max(length - gap, 0.5)
              const dashOffset = -offset
              offset += length
              const isActive = slice.id === activeId
              const dimmed = activeId !== null && !isActive

              return (
                <circle
                  key={slice.id}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={isActive ? STROKE_ACTIVE : STROKE}
                  strokeDasharray={`${drawn ? visible : 0} ${CIRCUMFERENCE}`}
                  strokeDashoffset={dashOffset}
                  opacity={dimmed ? 0.3 : 1}
                  className="cursor-pointer transition-all duration-500 ease-out"
                  onClick={() => toggle(slice.id)}
                  onMouseEnter={() => setActiveId(slice.id)}
                  onMouseLeave={() => setActiveId(null)}
                >
                  <title>
                    {`${slice.nome}: ${slice.quantidade} un. (${formatShare(slice.share)})`}
                  </title>
                </circle>
              )
            })}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
          {active ? (
            <>
              <p className="text-2xl font-extrabold text-secondary">
                {formatShare(active.share)}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs font-medium text-secondary">
                {active.nome}
              </p>
              <p className="text-xs text-muted">{active.quantidade} un.</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-extrabold text-secondary">{totalItens}</p>
              <p className="text-xs text-muted">itens vendidos</p>
            </>
          )}
        </div>
      </div>

      <ul className="w-full space-y-1">
        {slices.map((slice) => {
          const isActive = slice.id === activeId

          return (
            <li key={slice.id}>
              <button
                type="button"
                onClick={() => toggle(slice.id)}
                aria-pressed={isActive}
                className={[
                  'flex w-full items-center gap-3 rounded-[var(--radius-button)] px-2 py-2 text-left transition-colors duration-150',
                  isActive ? 'bg-secondary/5' : 'hover:bg-secondary/5',
                ].join(' ')}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: slice.color }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-secondary">
                    {slice.nome}
                  </span>
                  <span className="block text-xs text-muted">
                    {slice.quantidade} un. · {formatBRL(slice.faturado)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-secondary">
                  {formatShare(slice.share)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
