import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { cepErrorMessage, formatCep, isCompleteCep } from '@/lib/format/cep'
import { INPUT_LIMITS } from '@/lib/security/limits'
import { sanitizeTextField } from '@/lib/security/sanitize'
import type { Condominio } from '@/types/database'
import {
  lookupCepAddress,
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
  const [cepHint, setCepHint] = useState<string | null>(null)
  const [cepHintError, setCepHintError] = useState<string | null>(null)
  const [geocoding, setGeocoding] = useState(false)

  useEffect(() => {
    setValues(toFormValues(initial))
    setCepHint(null)
    setCepHintError(null)
  }, [initial])

  useEffect(() => {
    if (!isCompleteCep(values.cep)) {
      setCepHint(null)
      setCepHintError(null)
      return
    }

    let cancelled = false

    async function validateCep() {
      const result = await lookupCepAddress(values.cep)

      if (cancelled) return

      if (result.error || !result.data) {
        setCepHint(null)
        setCepHintError(result.error ?? 'CEP não encontrado.')
        return
      }

      setCepHintError(null)
      setCepHint(result.data.endereco)

      setValues((current) => {
        if (current.endereco.trim()) {
          return current
        }

        return { ...current, endereco: result.data!.endereco }
      })
    }

    void validateCep()

    return () => {
      cancelled = true
    }
  }, [values.cep])

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

    const incompleteCep = cepErrorMessage(values.cep)
    if (incompleteCep) {
      setError(incompleteCep)
      return
    }

    if (cepHintError) {
      setError(cepHintError)
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
        label="CEP"
        placeholder="00000-000"
        inputMode="numeric"
        autoComplete="postal-code"
        value={values.cep}
        maxLength={9}
        error={cepHintError ?? undefined}
        onChange={(event) => {
          const formatted = formatCep(event.target.value)
          setValues((current) => ({ ...current, cep: formatted }))
        }}
      />

      {cepHint && !cepHintError ? (
        <p className="-mt-2 text-xs text-success">CEP encontrado: {cepHint}</p>
      ) : (
        <p className="-mt-2 text-xs text-muted">
          Digite o CEP no formato 00000-000 para localizar no mapa.
        </p>
      )}

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
