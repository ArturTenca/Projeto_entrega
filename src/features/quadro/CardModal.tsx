import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { INPUT_LIMITS } from '@/lib/security/limits'
import { sanitizeTextField } from '@/lib/security/sanitize'
import type { QuadroCard, QuadroColuna } from '@/types/database'

interface CardModalProps {
  open: boolean
  card: QuadroCard | null
  colunas: QuadroColuna[]
  defaultColunaId: string
  saving?: boolean
  onClose: () => void
  onSave: (values: {
    titulo: string
    descricao: string | null
    data_entrega: string | null
    coluna_id: string
  }) => Promise<void>
  onDelete?: () => Promise<void>
}

export function CardModal({
  open,
  card,
  colunas,
  defaultColunaId,
  saving = false,
  onClose,
  onSave,
  onDelete,
}: CardModalProps) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dataEntrega, setDataEntrega] = useState('')
  const [colunaId, setColunaId] = useState(defaultColunaId)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!open) return

    setTitulo(card?.titulo ?? '')
    setDescricao(card?.descricao ?? '')
    setDataEntrega(card?.data_entrega ?? '')
    setColunaId(card?.coluna_id ?? defaultColunaId)
    setError(null)
    setDeleting(false)
  }, [open, card, defaultColunaId])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!titulo.trim()) {
      setError('Informe o nome do card.')
      return
    }

    await onSave({
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      data_entrega: dataEntrega || null,
      coluna_id: colunaId,
    })
  }

  async function handleDelete() {
    if (!onDelete) return
    setDeleting(true)
    await onDelete()
    setDeleting(false)
  }

  return (
    <Modal
      open={open}
      title={card ? 'Editar card' : 'Novo card'}
      onClose={onClose}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          label="Nome"
          value={titulo}
          maxLength={INPUT_LIMITS.NOME_MAX}
          onChange={(event) =>
            setTitulo(
              sanitizeTextField(event.target.value, INPUT_LIMITS.NOME_MAX),
            )
          }
          required
        />

        <Textarea
          label="Legenda"
          value={descricao}
          maxLength={INPUT_LIMITS.OBSERVACOES_MAX}
          onChange={(event) =>
            setDescricao(
              sanitizeTextField(
                event.target.value,
                INPUT_LIMITS.OBSERVACOES_MAX,
              ),
            )
          }
        />

        <Input
          label="Data de entrega"
          type="date"
          value={dataEntrega}
          onChange={(event) => setDataEntrega(event.target.value)}
        />

        <Select
          label="Lista"
          value={colunaId}
          onChange={(event) => setColunaId(event.target.value)}
          options={colunas.map((coluna) => ({
            value: coluna.id,
            label: coluna.nome,
          }))}
        />

        {error ? (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" fullWidth loading={saving}>
            Salvar
          </Button>
        </div>

        {card && onDelete ? (
          <Button
            type="button"
            variant="danger"
            fullWidth
            loading={deleting}
            onClick={() => void handleDelete()}
          >
            Excluir card
          </Button>
        ) : null}
      </form>
    </Modal>
  )
}
