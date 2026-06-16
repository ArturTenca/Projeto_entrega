/** Limites de tamanho para evitar payloads excessivos (não há mínimo de senha — definido no Supabase). */
export const INPUT_LIMITS = {
  EMAIL_MAX: 254,
  PASSWORD_MAX: 128,
  NOME_MAX: 120,
  ENDERECO_MAX: 255,
  TELEFONE_MAX: 20,
  OBSERVACOES_MAX: 500,
  QUANTIDADE_MAX: 9999,
} as const