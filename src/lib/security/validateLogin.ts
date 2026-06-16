import { INPUT_LIMITS } from './limits'
import { sanitizeEmailInput, sanitizePasswordInput } from './sanitize'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type LoginValidationResult =
  | { ok: true; email: string; password: string }
  | { ok: false; error: string }

function isValidEmailFormat(email: string): boolean {
  if (email.length > INPUT_LIMITS.EMAIL_MAX) {
    return false
  }

  return EMAIL_PATTERN.test(email)
}

/**
 * Valida e sanitiza credenciais antes de enviar ao Supabase Auth.
 * SQL injection não se aplica aqui: o SDK usa API parametrizada, sem SQL no client.
 */
export function validateLoginCredentials(
  email: string,
  password: string,
): LoginValidationResult {
  const sanitizedEmail = sanitizeEmailInput(email)
  const sanitizedPassword = sanitizePasswordInput(password)

  if (!sanitizedEmail || !sanitizedPassword) {
    return { ok: false, error: 'Preencha email e senha.' }
  }

  if (sanitizedEmail.length > INPUT_LIMITS.EMAIL_MAX) {
    return { ok: false, error: 'Email muito longo.' }
  }

  if (sanitizedPassword.length > INPUT_LIMITS.PASSWORD_MAX) {
    return { ok: false, error: 'Senha muito longa.' }
  }

  if (!isValidEmailFormat(sanitizedEmail)) {
    return { ok: false, error: 'Informe um email válido.' }
  }

  return {
    ok: true,
    email: sanitizedEmail.toLowerCase(),
    password: sanitizedPassword,
  }
}
