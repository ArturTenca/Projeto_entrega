import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Button } from '@/components/ui/Button'
import { QuadroCardItem } from './QuadroCardItem'
import type { QuadroCard, QuadroColuna } from '@/types/database'

interface QuadroColumnProps {
  coluna: QuadroColuna
  cards: QuadroCard[]
  onOpenCard: (card: QuadroCard) => void
  onAddCard: () => void
  onRename: (nome: string) => Promise<void>
  onDelete: () => Promise<void>
  canDelete: boolean
}

export function QuadroColumn({
  coluna,
  cards,
  onOpenCard,
  onAddCard,
  onRename,
  onDelete,
  canDelete,
}: QuadroColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: coluna.id,
    data: { type: 'column', colunaId: coluna.id },
  })
  const [editing, setEditing] = useState(false)
  const [nome, setNome] = useState(coluna.nome)

  async function handleRename() {
    const next = nome.trim()
    if (!next || next === coluna.nome) {
      setNome(coluna.nome)
      setEditing(false)
      return
    }

    await onRename(next)
    setEditing(false)
  }

  return (
    <section
      className={[
        'flex h-full min-h-0 min-w-[16rem] flex-1 shrink-0 snap-center flex-col rounded-[var(--radius-card-lg)] border border-border bg-background',
        isOver ? 'border-primary' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="flex items-center gap-2 border-b border-border px-3 py-3">
        {editing ? (
          <input
            aria-label="Nome da lista"
            value={nome}
            maxLength={80}
            className="min-h-10 min-w-0 flex-1 rounded-[var(--radius-button)] border border-border bg-card px-2 text-sm text-secondary"
            autoFocus
            onChange={(event) => setNome(event.target.value)}
            onBlur={() => {
              void handleRename()
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleRename()
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-secondary"
            onClick={() => setEditing(true)}
          >
            {coluna.nome}
          </button>
        )}
        <span className="rounded-full bg-muted/10 px-2 py-0.5 text-xs font-medium text-muted">
          {cards.length}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className="flex min-h-[12rem] min-w-0 flex-1 flex-col gap-2 overflow-y-auto p-2"
      >
        {cards.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted">
            Nenhum card nesta lista
          </p>
        ) : (
          cards.map((card) => (
            <QuadroCardItem
              key={card.id}
              card={card}
              onOpen={() => onOpenCard(card)}
            />
          ))
        )}
      </div>

      <div className="flex gap-2 border-t border-border p-2">
        <Button variant="secondary" size="sm" fullWidth onClick={onAddCard}>
          Novo card
        </Button>
        {canDelete ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void onDelete()
            }}
          >
            Excluir
          </Button>
        ) : null}
      </div>
    </section>
  )
}
