import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { INPUT_LIMITS } from '@/lib/security/limits'
import { sanitizeTextField } from '@/lib/security/sanitize'
import type { Produto } from '@/types/database'

export type ProdutoFormValues = {
  nome: string
  ativo: boolean
}

interface ProdutoFormProps {
  initial?: Produto | null
  loading?: boolean
  onSubmit: (values: ProdutoFormValues) => Promise<void>
  onCancel: () => void
}

function toFormValues(produto?: Produto | null): ProdutoFormValues {
  return {
    nome: produto?.nome ?? '',
    ativo: produto?.ativo ?? true,
  }
}

export function ProdutoForm({
  initial,
  loading = false,
  onSubmit,
  onCancel,
}: ProdutoFormProps) {
  const [values, setValues] = useState<ProdutoFormValues>(() =>
    toFormValues(initial),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValues(toFormValues(initial))
  }, [initial])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!values.nome.trim()) {
      setError('Informe o nome do produto.')
      return
    }

    await onSubmit(values)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <Input
        label="Nome do produto"
        value={values.nome}
        maxLength={INPUT_LIMITS.NOME_MAX}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            nome: sanitizeTextField(event.target.value, INPUT_LIMITS.NOME_MAX),
          }))
        }
        required
      />

      <label className="flex items-center gap-3 text-sm text-secondary">
        <input
          type="checkbox"
          checked={values.ativo}
          onChange={(event) =>
            setValues((current) => ({ ...current, ativo: event.target.checked }))
          }
          className="h-5 w-5 rounded border-border"
        />
        Produto ativo
      </label>

      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" fullWidth loading={loading}>
          Salvar
        </Button>
      </div>
    </form>
  )
}

export function parseProdutoPayload(values: ProdutoFormValues) {
  return {
    nome: values.nome.trim(),
    ativo: values.ativo,
  }
}
