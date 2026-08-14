import { useDraggable } from '@dnd-kit/core'
import type { QuadroCard } from '@/types/database'

interface QuadroCardItemProps {
  card: QuadroCard
  onOpen: () => void
}

function formatDueDate(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

export function QuadroCardItem({ card, onOpen }: QuadroCardItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { type: 'card', card },
  })

  const overdue =
    Boolean(card.data_entrega) &&
    card.data_entrega! < new Date().toISOString().slice(0, 10)

  return (
    <article
      ref={setNodeRef}
      className={[
        'rounded-[var(--radius-card)] border border-border bg-card p-3',
        isDragging ? 'opacity-40' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none text-muted active:cursor-grabbing"
          aria-label="Arrastar card"
          {...listeners}
          {...attributes}
        >
          <svg
            viewBox="0 0 16 16"
            className="h-4 w-4"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="5" cy="4" r="1.2" />
            <circle cx="11" cy="4" r="1.2" />
            <circle cx="5" cy="8" r="1.2" />
            <circle cx="11" cy="8" r="1.2" />
            <circle cx="5" cy="12" r="1.2" />
            <circle cx="11" cy="12" r="1.2" />
          </svg>
        </button>

        <button type="button" className="min-w-0 flex-1 text-left" onClick={onOpen}>
          <p className="truncate text-sm font-semibold text-secondary">
            {card.titulo}
          </p>
          {card.descricao ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted">
              {card.descricao}
            </p>
          ) : null}
          {card.data_entrega ? (
            <p
              className={[
                'mt-2 text-xs font-medium',
                overdue ? 'text-error' : 'text-muted',
              ].join(' ')}
            >
              Entrega {formatDueDate(card.data_entrega)}
            </p>
          ) : null}
        </button>
      </div>
    </article>
  )
}
