const CEP_LENGTH = 8

export function cepDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, CEP_LENGTH)
}

export function formatCep(value: string): string {
  const digits = cepDigits(value)

  if (digits.length <= 5) {
    return digits
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function isCompleteCep(value: string): boolean {
  return cepDigits(value).length === CEP_LENGTH
}

export function cepErrorMessage(value: string): string | null {
  const digits = cepDigits(value)

  if (digits.length === 0) {
    return null
  }

  if (digits.length < CEP_LENGTH) {
    return 'CEP incompleto. Use o formato 00000-000.'
  }

  return null
}
