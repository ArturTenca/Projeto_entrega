import { type FormEvent, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/features/auth/AuthProvider'
import { useLoginRateLimit } from '@/features/auth/useLoginRateLimit'
import { INPUT_LIMITS } from '@/lib/security/limits'
import { getSafeInternalPath } from '@/lib/security/paths'
import {
  sanitizeEmailInput,
  sanitizePasswordInput,
} from '@/lib/security/sanitize'
import { validateLoginCredentials } from '@/lib/security/validateLogin'
import { clearLocalLoginBlock } from '@/lib/security/loginRateLimitApi'

export function LoginPage() {
  const { signIn } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const {
    isLocked,
    isCooldown,
    isIpBlocked,
    isWatchMode,
    remainingSeconds,
    blockMessage,
    recordFailure,
    reset,
    refreshIpBlock,
  } = useLoginRateLimit()

  const from = getSafeInternalPath(
    (location.state as { from?: string } | null)?.from,
  )

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isConfigured =
    Boolean(import.meta.env.VITE_SUPABASE_URL) &&
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (isIpBlocked) {
      setError(blockMessage ?? 'Acesso temporariamente bloqueado.')
      return
    }

    if (isCooldown) {
      setError(`Aguarde ${remainingSeconds}s antes de tentar novamente.`)
      return
    }

    const allowed = await refreshIpBlock()

    if (!allowed) {
      setError(blockMessage ?? 'Acesso temporariamente bloqueado.')
      return
    }

    const validation = validateLoginCredentials(email, password)

    if (!validation.ok) {
      setError(validation.error)
      return
    }

    setLoading(true)

    const result = await signIn(validation.email, validation.password)

    if (result.error) {
      const failure = await recordFailure()
      setError(
        failure.ipBlocked && failure.message
          ? failure.message
          : result.error,
      )
      setLoading(false)
      return
    }

    reset()
    clearLocalLoginBlock()
    navigate(from, { replace: true })
  }

  const formDisabled = loading || !isConfigured || isLocked

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-[390px]">
        <div className="mb-8 text-center">
          <Logo className="mx-auto h-12 w-auto" />
          <p className="mt-4 text-lg font-medium text-secondary">Entregas</p>
          <p className="mt-2 text-sm text-muted">
            Acesse para gerenciar pedidos e entregas
          </p>
        </div>

        <Card variant="important">
          {!isConfigured ? (
            <p className="mb-4 rounded-[var(--radius-button)] bg-warning/10 p-3 text-sm text-secondary">
              Configure as variáveis de ambiente do Supabase em{' '}
              <code className="text-xs">.env</code> para habilitar o login.
            </p>
          ) : null}

          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
            noValidate
            autoComplete="on"
          >
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
              maxLength={INPUT_LIMITS.EMAIL_MAX}
              value={email}
              onChange={(event) =>
                setEmail(sanitizeEmailInput(event.target.value))
              }
              disabled={formDisabled}
              required
            />

            <Input
              label="Senha"
              type="password"
              name="password"
              autoComplete="current-password"
              maxLength={INPUT_LIMITS.PASSWORD_MAX}
              value={password}
              onChange={(event) =>
                setPassword(sanitizePasswordInput(event.target.value))
              }
              disabled={formDisabled}
              required
            />

            {error ? (
              <p className="text-sm text-error" role="alert">
                {error}
              </p>
            ) : null}

            {isCooldown ? (
              <p className="text-sm text-warning" role="status">
                Muitas tentativas incorretas. Aguarde {remainingSeconds}s.
              </p>
            ) : null}

            {isWatchMode ? (
              <p className="text-sm text-warning" role="status">
                Última tentativa antes do bloqueio de 24 horas neste IP.
              </p>
            ) : null}

            {isIpBlocked && blockMessage ? (
              <p className="text-sm text-error" role="status">
                {blockMessage}
              </p>
            ) : null}

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={!isConfigured || isLocked}
            >
              Entrar
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
