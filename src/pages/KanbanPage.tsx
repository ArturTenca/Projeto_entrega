import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'
import { CardModal } from '@/features/quadro/CardModal'
import { QuadroColumn } from '@/features/quadro/QuadroColumn'
import {
  createCard,
  createColuna,
  deleteCard,
  deleteColuna,
  fetchQuadro,
  renameColuna,
  updateCard,
} from '@/features/quadro/api'
import { sanitizeTextField } from '@/lib/security/sanitize'
import type { QuadroCard, QuadroColuna } from '@/types/database'

export function KanbanPage() {
  const [colunas, setColunas] = useState<QuadroColuna[]>([])
  const [cards, setCards] = useState<QuadroCard[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeCard, setActiveCard] = useState<QuadroCard | null>(null)
  const [modal, setModal] = useState<{
    colunaId: string
    card: QuadroCard | null
  } | null>(null)
  const [newListName, setNewListName] = useState('')
  const [addingList, setAddingList] = useState(false)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
  )

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      const result = await fetchQuadro()
      if (!mounted) return
      setColunas(result.colunas)
      setCards(result.cards)
      setError(result.error)
      setLoading(false)
    }

    void load()

    return () => {
      mounted = false
    }
  }, [])

  const cardsByColuna = useMemo(() => {
    const map = new Map<string, QuadroCard[]>()
    for (const coluna of colunas) {
      map.set(coluna.id, [])
    }
    for (const card of cards) {
      const list = map.get(card.coluna_id)
      if (list) list.push(card)
    }
    return map
  }, [colunas, cards])

  async function handleSaveCard(values: {
    titulo: string
    descricao: string | null
    data_entrega: string | null
    coluna_id: string
  }) {
    if (!modal) return
    setSaving(true)
    setError(null)

    if (modal.card) {
      const result = await updateCard(modal.card.id, values)
      if (result.error) {
        setError(result.error)
        setSaving(false)
        return
      }
      setCards((current) =>
        current.map((card) =>
          card.id === modal.card!.id ? { ...card, ...values } : card,
        ),
      )
    } else {
      const posicao = cardsByColuna.get(values.coluna_id)?.length ?? 0
      const result = await createCard({ ...values, posicao })
      if (result.error || !result.data) {
        setError(result.error ?? 'Não foi possível criar o card.')
        setSaving(false)
        return
      }
      setCards((current) => [...current, result.data!])
    }

    setSaving(false)
    setModal(null)
  }

  async function handleDeleteCard() {
    if (!modal?.card) return
    const result = await deleteCard(modal.card.id)
    if (result.error) {
      setError(result.error)
      return
    }
    setCards((current) => current.filter((card) => card.id !== modal.card!.id))
    setModal(null)
  }

  async function handleAddList() {
    const nome = newListName.trim()
    if (!nome) return

    setAddingList(true)
    const result = await createColuna(nome, colunas.length)
    setAddingList(false)

    if (result.error || !result.data) {
      setError(result.error ?? 'Não foi possível criar a lista.')
      return
    }

    setColunas((current) => [...current, result.data!])
    setNewListName('')
  }

  async function handleRename(id: string, nome: string) {
    const result = await renameColuna(id, nome)
    if (result.error) {
      setError(result.error)
      return
    }
    setColunas((current) =>
      current.map((coluna) =>
        coluna.id === id ? { ...coluna, nome } : coluna,
      ),
    )
  }

  async function handleDeleteColuna(id: string) {
    if (colunas.length <= 1) return
    const result = await deleteColuna(id)
    if (result.error) {
      setError(result.error)
      return
    }
    setColunas((current) => current.filter((coluna) => coluna.id !== id))
    setCards((current) => current.filter((card) => card.coluna_id !== id))
  }

  function handleDragStart(event: DragStartEvent) {
    const card = event.active.data.current?.card as QuadroCard | undefined
    setActiveCard(card ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null)
    const card = event.active.data.current?.card as QuadroCard | undefined
    const colunaId =
      (event.over?.data.current?.colunaId as string | undefined) ??
      (typeof event.over?.id === 'string' ? event.over.id : null)

    if (!card || !colunaId || card.coluna_id === colunaId) return

    const posicao = cardsByColuna.get(colunaId)?.length ?? 0
    setCards((current) =>
      current.map((item) =>
        item.id === card.id ? { ...item, coluna_id: colunaId, posicao } : item,
      ),
    )

    const result = await updateCard(card.id, {
      coluna_id: colunaId,
      posicao,
    })
    if (result.error) {
      setError(result.error)
    }
  }

  if (loading) {
    return <LoadingState message="Carregando quadro..." />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <header className="shrink-0 space-y-1">
        <h1 className="page-title">Quadro</h1>
        <p className="text-center text-sm text-muted">
          Organize tarefas. Clique no card para editar.
        </p>
      </header>

      {error ? (
        <p className="shrink-0 text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={(event) => {
          void handleDragEnd(event)
        }}
        onDragCancel={() => setActiveCard(null)}
      >
        <div className="flex min-h-0 flex-1 snap-x snap-mandatory items-stretch gap-3 overflow-x-auto overscroll-x-contain pb-1">
          {colunas.map((coluna) => (
            <QuadroColumn
              key={coluna.id}
              coluna={coluna}
              cards={cardsByColuna.get(coluna.id) ?? []}
              onOpenCard={(card) => setModal({ colunaId: coluna.id, card })}
              onAddCard={() => setModal({ colunaId: coluna.id, card: null })}
              onRename={(nome) => handleRename(coluna.id, nome)}
              onDelete={() => handleDeleteColuna(coluna.id)}
              canDelete={colunas.length > 1}
            />
          ))}

          <section className="flex h-fit w-64 shrink-0 snap-center flex-col gap-3 rounded-[var(--radius-card-lg)] border border-dashed border-border p-3">
            <p className="text-sm font-medium text-secondary">Nova lista</p>
            <Input
              label="Nome"
              placeholder="Ex: Pós finalizado"
              value={newListName}
              maxLength={80}
              onChange={(event) =>
                setNewListName(
                  sanitizeTextField(event.target.value, 80),
                )
              }
            />
            <Button
              size="sm"
              fullWidth
              loading={addingList}
              disabled={!newListName.trim()}
              onClick={() => {
                void handleAddList()
              }}
            >
              Adicionar lista
            </Button>
          </section>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="w-[min(85vw,20rem)] rounded-[var(--radius-card)] border border-primary bg-card p-3">
              <p className="truncate text-sm font-semibold text-secondary">
                {activeCard.titulo}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardModal
        open={Boolean(modal)}
        card={modal?.card ?? null}
        colunas={colunas}
        defaultColunaId={modal?.colunaId ?? colunas[0]?.id ?? ''}
        saving={saving}
        onClose={() => setModal(null)}
        onSave={handleSaveCard}
        onDelete={modal?.card ? handleDeleteCard : undefined}
      />
    </div>
  )
}
