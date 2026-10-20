import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  formatBRL,
  formatMoneyInput,
  moneyInputToNumber,
  numberToMoneyInput,
} from '@/lib/format/currency'
import { INPUT_LIMITS } from '@/lib/security/limits'
import { sanitizeTextField } from '@/lib/security/sanitize'
import type { Produto } from '@/types/database'

export type ProdutoFormValues = {
  nome: string
  precoCusto: string
  precoVenda: string
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
    // Produtos antigos vieram com 0 da migration: deixa vazio para obrigar o preenchimento.
    precoCusto: produto?.preco_custo ? numberToMoneyInput(produto.preco_custo) : '',
    precoVenda: produto?.preco_venda ? numberToMoneyInput(produto.preco_venda) : '',
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

  const custo = moneyInputToNumber(values.precoCusto)
  const venda = moneyInputToNumber(values.precoVenda)
  const lucro = custo !== null && venda !== null ? venda - custo : null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!values.nome.trim()) {
      setError('Informe o nome do produto.')
      return
    }

    if (custo === null || custo <= 0) {
      setError('Informe o valor de custo.')
      return
    }

    if (venda === null || venda <= 0) {
      setError('Informe o valor de venda.')
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

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Custo (R$)"
          inputMode="numeric"
          placeholder="0,00"
          value={values.precoCusto}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              precoCusto: formatMoneyInput(event.target.value),
            }))
          }
          required
        />
        <Input
          label="Venda (R$)"
          inputMode="numeric"
          placeholder="0,00"
          value={values.precoVenda}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              precoVenda: formatMoneyInput(event.target.value),
            }))
          }
          required
        />
      </div>

      {lucro !== null ? (
        <p className="text-sm text-muted">
          Lucro por unidade:{' '}
          <span
            className={[
              'font-semibold',
              lucro >= 0 ? 'text-success' : 'text-error',
            ].join(' ')}
          >
            {formatBRL(lucro)}
          </span>
        </p>
      ) : null}

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
    preco_custo: moneyInputToNumber(values.precoCusto) ?? 0,
    preco_venda: moneyInputToNumber(values.precoVenda) ?? 0,
    ativo: values.ativo,
  }
}
