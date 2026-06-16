import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { INPUT_LIMITS } from '@/lib/security/limits'
import { sanitizeTextField } from '@/lib/security/sanitize'
import type {
  ClienteComCondominio,
  DiaSemana,
  PedidoComCliente,
  PedidoStatus,
  Produto,
} from '@/types/database'
import { DIA_SEMANA_LABEL, PEDIDO_STATUS_LABEL } from '@/types/database'

export type PedidoFormValues = {
  cliente_id: string
  produto_id: string
  quantidade: string
  dia_semana: DiaSemana
  status: PedidoStatus
  observacoes: string
}

interface PedidoFormProps {
  initial?: PedidoComCliente | null
  clientes: ClienteComCondominio[]
  produtos: Produto[]
  loading?: boolean
  onSubmit: (values: PedidoFormValues) => Promise<void>
  onCancel: () => void
}

const DIA_OPTIONS = (Object.keys(DIA_SEMANA_LABEL) as DiaSemana[]).map(
  (dia) => ({
    value: dia,
    label: DIA_SEMANA_LABEL[dia],
  }),
)

const STATUS_OPTIONS = (
  Object.keys(PEDIDO_STATUS_LABEL) as PedidoStatus[]
).map((status) => ({
  value: status,
  label: PEDIDO_STATUS_LABEL[status],
}))

function toFormValues(pedido?: PedidoComCliente | null): PedidoFormValues {
  return {
    cliente_id: pedido?.cliente_id ?? '',
    produto_id: pedido?.produto_id ?? '',
    quantidade: pedido?.quantidade?.toString() ?? '',
    dia_semana: pedido?.dia_semana ?? 'segunda',
    status: pedido?.status ?? 'ativo',
    observacoes: pedido?.observacoes ?? '',
  }
}

export function PedidoForm({
  initial,
  clientes,
  produtos,
  loading = false,
  onSubmit,
  onCancel,
}: PedidoFormProps) {
  const [values, setValues] = useState<PedidoFormValues>(() =>
    toFormValues(initial),
  )
  const [error, setError] = useState<string | null>(null)

  const selectedCliente = useMemo(
    () => clientes.find((cliente) => cliente.id === values.cliente_id),
    [clientes, values.cliente_id],
  )

  const hasFavorite =
    Boolean(selectedCliente?.produto_favorito_id) &&
    Boolean(selectedCliente?.quantidade_favorita) &&
    Boolean(selectedCliente?.produto_favorito)

  useEffect(() => {
    setValues(toFormValues(initial))
  }, [initial])

  function applyFavorite() {
    if (!selectedCliente?.produto_favorito_id || !selectedCliente.quantidade_favorita) {
      return
    }

    setValues((current) => ({
      ...current,
      produto_id: selectedCliente.produto_favorito_id!,
      quantidade: selectedCliente.quantidade_favorita!.toString(),
    }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!values.cliente_id) {
      setError('Selecione um cliente.')
      return
    }

    if (!values.produto_id) {
      setError('Selecione um produto.')
      return
    }

    const quantidade = Number.parseInt(values.quantidade, 10)

    if (!quantidade || quantidade < 1 || quantidade > INPUT_LIMITS.QUANTIDADE_MAX) {
      setError('Informe uma quantidade válida.')
      return
    }

    await onSubmit(values)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <Select
        label="Cliente"
        placeholder="Selecione um cliente"
        value={values.cliente_id}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            cliente_id: event.target.value,
          }))
        }
        options={clientes
          .filter((cliente) => cliente.ativo)
          .map((cliente) => ({
            value: cliente.id,
            label: cliente.nome,
          }))}
        required
      />

      {hasFavorite ? (
        <Card className="border-primary/30 bg-primary/5">
          <p className="text-sm font-medium text-secondary">Pedido favorito</p>
          <p className="mt-1 text-sm text-muted">
            {selectedCliente!.produto_favorito!.nome} ·{' '}
            {selectedCliente!.quantidade_favorita} un.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth
            className="mt-3"
            onClick={applyFavorite}
          >
            Usar pedido favorito
          </Button>
        </Card>
      ) : null}

      <Select
        label="Produto"
        placeholder="Selecione um produto"
        value={values.produto_id}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            produto_id: event.target.value,
          }))
        }
        options={produtos
          .filter((produto) => produto.ativo)
          .map((produto) => ({
            value: produto.id,
            label: produto.nome,
          }))}
        required
      />

      <Input
        label="Quantidade"
        type="number"
        min={1}
        max={INPUT_LIMITS.QUANTIDADE_MAX}
        inputMode="numeric"
        value={values.quantidade}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            quantidade: event.target.value.replace(/\D/g, '').slice(0, 4),
          }))
        }
        required
      />

      <Select
        label="Dia da entrega"
        value={values.dia_semana}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            dia_semana: event.target.value as DiaSemana,
          }))
        }
        options={DIA_OPTIONS}
      />

      <Select
        label="Status"
        value={values.status}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            status: event.target.value as PedidoStatus,
          }))
        }
        options={STATUS_OPTIONS}
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

export function parsePedidoPayload(values: PedidoFormValues) {
  return {
    cliente_id: values.cliente_id,
    produto_id: values.produto_id || null,
    quantidade: Number.parseInt(values.quantidade, 10),
    dia_semana: values.dia_semana,
    status: values.status,
    observacoes: values.observacoes.trim() || null,
  }
}
