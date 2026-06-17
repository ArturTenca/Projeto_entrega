import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { INPUT_LIMITS } from '@/lib/security/limits'
import { sanitizeTextField } from '@/lib/security/sanitize'
import type { Condominio } from '@/types/database'
import {
  resolveCondominioPayload,
  type CondominioPayload,
} from './geocodeLocation'

export type CondominioFormValues = {
  nome: string
  endereco: string
  cep: string
  observacoes: string
  ativo: boolean
}

interface CondominioFormProps {
  initial?: Condominio | null
  loading?: boolean
  onSubmit: (payload: CondominioPayload) => Promise<void>
  onCancel: () => void
}

function toFormValues(condominio?: Condominio | null): CondominioFormValues {
  return {
    nome: condominio?.nome ?? '',
    endereco: condominio?.endereco ?? '',
    cep: '',
    observacoes: condominio?.observacoes ?? '',
    ativo: condominio?.ativo ?? true,
  }
}

export function CondominioForm({
  initial,
  loading = false,
  onSubmit,
  onCancel,
}: CondominioFormProps) {
  const [values, setValues] = useState<CondominioFormValues>(() =>
    toFormValues(initial),
  )
  const [error, setError] = useState<string | null>(null)
  const [geocoding, setGeocoding] = useState(false)

  useEffect(() => {
    setValues(toFormValues(initial))
  }, [initial])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!values.nome.trim()) {
      setError('Informe o nome do condomínio.')
      return
    }

    if (!values.endereco.trim() && !values.cep.trim()) {
      setError('Informe o endereço ou o CEP para localizar no mapa.')
      return
    }

    setGeocoding(true)
    const result = await resolveCondominioPayload(values)
    setGeocoding(false)

    if (result.error || !result.payload) {
      setError(result.error ?? 'Não foi possível salvar o condomínio.')
      return
    }

    await onSubmit(result.payload)
  }

  const saving = loading || geocoding

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <Input
        label="Nome"
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

      <Input
        label="Endereço"
        placeholder="Rua, número, bairro, cidade"
        value={values.endereco}
        maxLength={INPUT_LIMITS.ENDERECO_MAX}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            endereco: sanitizeTextField(
              event.target.value,
              INPUT_LIMITS.ENDERECO_MAX,
            ),
          }))
        }
      />

      <Input
        label="CEP"
        placeholder="00000-000"
        inputMode="numeric"
        value={values.cep}
        maxLength={9}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, 8)
          const formatted =
            digits.length > 5
              ? `${digits.slice(0, 5)}-${digits.slice(5)}`
              : digits

          setValues((current) => ({ ...current, cep: formatted }))
        }}
      />

      <p className="-mt-2 text-xs text-muted">
        Use o endereço completo ou só o CEP. A localização no mapa é gerada
        automaticamente.
      </p>

      <Textarea
        label="Observações"
        value={values.observacoes}
        maxLength={INPUT_LIMITS.OBSERVACOES_MAX}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            observacoes: sanitizeTextField(
              event.target.value,
              INPUT_LIMITS.OBSERVACOES_MAX,
            ),
          }))
        }
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
        Condomínio ativo
      </label>

      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          fullWidth
          disabled={saving}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" fullWidth loading={saving}>
          {geocoding ? 'Localizando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
