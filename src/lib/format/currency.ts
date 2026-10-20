const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatBRL(value: number): string {
  return brl.format(value)
}

/** Máscara de digitação: os dígitos viram centavos ("1250" → "12,50"). */
export function formatMoneyInput(value: string): string {
  const digits = value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10)

  if (digits.length === 0) return ''

  const cents = digits.padStart(3, '0')
  const inteiro = cents.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${inteiro},${cents.slice(-2)}`
}

export function moneyInputToNumber(value: string): number | null {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return null
  return Number(digits) / 100
}

export function numberToMoneyInput(value: number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return formatMoneyInput(Math.round(value * 100).toString())
}
