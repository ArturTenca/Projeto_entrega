import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { formatPhone, phoneToStorage } from '@/lib/format/phone'
import { INPUT_LIMITS } from '@/lib/security/limits'
import { sanitizeTextField } from '@/lib/security/sanitize'
import type { ClienteComCondominio, Condominio, Produto } from '@/types/database'

export type ClienteFormValues = {
  nome: string
  telefone: string
  endereco: string
  condominio_id: string
  produto_favorito_id: string
  quantidade_favorita: string
  observacoes: string
  ativo: boolean
}

interface ClienteFormProps {
  initial?: ClienteComCondominio | null
  condominios: Condominio[]
  produtos: Produto[]
  loading?: boolean
  onSubmit: (values: ClienteFormValues) => Promise<void>
  onCancel: () => void
}

function toFormValues(cliente?: ClienteComCondominio | null): ClienteFormValues {
  return {
    nome: cliente?.nome ?? '',
    telefone: cliente?.telefone ? formatPhone(cliente.telefone) : '',
    endereco: cliente?.endereco ?? '',
    condominio_id: cliente?.condominio_id ?? '',
    produto_favorito_id: cliente?.produto_favorito_id ?? '',
    quantidade_favorita: cliente?.quantidade_favorita?.toString() ?? '',
    observacoes: cliente?.observacoes ?? '',
    ativo: cliente?.ativo ?? true,
  }
}

export function ClienteForm({
  initial,
  condominios,
  produtos,
  loading = false,
  onSubmit,
  onCancel,
}: ClienteFormProps) {
  const [values, setValues] = useState<ClienteFormValues>(() =>
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
      setError('Informe o nome do cliente.')
      return
    }

    if (values.produto_favorito_id && !values.quantidade_favorita.trim()) {
      setError('Informe a quantidade do pedido favorito.')
      return
    }

    if (values.quantidade_favorita.trim()) {
      const qty = Number.parseInt(values.quantidade_favorita, 10)
      if (!qty || qty < 1 || qty > INPUT_LIMITS.QUANTIDADE_MAX) {
        setError('Quantidade favorita inválida.')
        return
      }
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
        label="Telefone"
        type="tel"
        inputMode="tel"
        value={values.telefone}
        maxLength={INPUT_LIMITS.TELEFONE_MAX}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            telefone: formatPhone(event.target.value),
          }))
        }
      />

      <Select
        label="Condomínio"
        placeholder="Selecione um condomínio"
        value={values.condominio_id}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            condominio_id: event.target.value,
          }))
        }
        options={condominios
          .filter((item) => item.ativo)
          .map((item) => ({ value: item.id, label: item.nome }))}
      />

      <Input
        label="Endereço / apartamento"
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

      <div className="rounded-[var(--radius-button)] border border-border bg-background p-3">
        <p className="mb-3 text-sm font-medium text-secondary">Pedido favorito</p>
        <div className="flex flex-col gap-4">
          <Select
            label="Produto favorito"
            placeholder="Nenhum"
            value={values.produto_favorito_id}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                produto_favorito_id: event.target.value,
                quantidade_favorita: event.target.value
                  ? current.quantidade_favorita
                  : '',
              }))
            }
            options={produtos
              .filter((item) => item.ativo)
              .map((item) => ({ value: item.id, label: item.nome }))}
          />

          {values.produto_favorito_id ? (
            <Input
              label="Quantidade favorita"
              type="number"
              min={1}
              max={INPUT_LIMITS.QUANTIDADE_MAX}
              inputMode="numeric"
              value={values.quantidade_favorita}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  quantidade_favorita: event.target.value
                    .replace(/\D/g, '')
                    .slice(0, 4),
                }))
              }
            />
          ) : null}
        </div>
      </div>

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
        Cliente ativo
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

export function parseClientePayload(values: ClienteFormValues) {
  const telefone = phoneToStorage(values.telefone)
  const quantidadeFavorita = values.quantidade_favorita.trim()
    ? Number.parseInt(values.quantidade_favorita, 10)
    : null

  return {
    nome: values.nome.trim(),
    telefone: telefone || null,
    endereco: values.endereco.trim() || null,
    condominio_id: values.condominio_id || null,
    produto_favorito_id: values.produto_favorito_id || null,
    quantidade_favorita:
      values.produto_favorito_id && quantidadeFavorita ? quantidadeFavorita : null,
    observacoes: values.observacoes.trim() || null,
    ativo: values.ativo,
  }
}
