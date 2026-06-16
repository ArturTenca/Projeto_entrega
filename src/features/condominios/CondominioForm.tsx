import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { INPUT_LIMITS } from '@/lib/security/limits'
import { sanitizeTextField } from '@/lib/security/sanitize'
import type { Condominio } from '@/types/database'

export type CondominioFormValues = {
  nome: string
  endereco: string
  latitude: string
  longitude: string
  observacoes: string
  ativo: boolean
}

interface CondominioFormProps {
  initial?: Condominio | null
  loading?: boolean
  onSubmit: (values: CondominioFormValues) => Promise<void>
  onCancel: () => void
}

function toFormValues(condominio?: Condominio | null): CondominioFormValues {
  return {
    nome: condominio?.nome ?? '',
    endereco: condominio?.endereco ?? '',
    latitude: condominio?.latitude?.toString() ?? '',
    longitude: condominio?.longitude?.toString() ?? '',
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

    await onSubmit(values)
  }

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
        label="Latitude (opcional)"
        type="number"
        step="any"
        inputMode="decimal"
        value={values.latitude}
        onChange={(event) =>
          setValues((current) => ({ ...current, latitude: event.target.value }))
        }
      />

      <Input
        label="Longitude (opcional)"
        type="number"
        step="any"
        inputMode="decimal"
        value={values.longitude}
        onChange={(event) =>
          setValues((current) => ({ ...current, longitude: event.target.value }))
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

export function parseCondominioPayload(values: CondominioFormValues) {
  const latitude = values.latitude.trim()
    ? Number.parseFloat(values.latitude)
    : null
  const longitude = values.longitude.trim()
    ? Number.parseFloat(values.longitude)
    : null

  return {
    nome: values.nome.trim(),
    endereco: values.endereco.trim() || null,
    latitude:
      latitude !== null && !Number.isNaN(latitude) && latitude >= -90 && latitude <= 90
        ? latitude
        : null,
    longitude:
      longitude !== null &&
      !Number.isNaN(longitude) &&
      longitude >= -180 &&
      longitude <= 180
        ? longitude
        : null,
    observacoes: values.observacoes.trim() || null,
    ativo: values.ativo,
  }
}
