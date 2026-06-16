import { INPUT_LIMITS } from './limits'

/** Remove caracteres de controle e null bytes (comum em tentativas de injeção). */
export function stripControlCharacters(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
}

export function sanitizeEmailInput(value: string): string {
  return stripControlCharacters(value).trim().slice(0, INPUT_LIMITS.EMAIL_MAX)
}

export function sanitizePasswordInput(value: string): string {
  return stripControlCharacters(value).slice(0, INPUT_LIMITS.PASSWORD_MAX)
}

export function sanitizeTextField(
  value: string,
  maxLength: number,
): string {
  return stripControlCharacters(value).trim().slice(0, maxLength)
}
