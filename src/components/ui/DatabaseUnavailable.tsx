import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface DatabaseUnavailableProps {
  onRetry?: () => void
  retrying?: boolean
  title?: string
  description?: string
}

export function DatabaseUnavailable({
  onRetry,
  retrying = false,
  title = 'Erro no banco de dados',
  description = 'O site carregou, mas não foi possível conectar ao banco de dados. O serviço pode estar pausado ou indisponível no momento.',
}: DatabaseUnavailableProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-[390px]">
        <div className="mb-8 text-center">
          <Logo className="mx-auto h-12 w-auto" />
          <p className="mt-4 text-lg font-medium text-secondary">Entregas</p>
        </div>

        <Card variant="important">
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <ellipse cx="12" cy="6" rx="8" ry="3" />
                <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
                <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="text-lg font-semibold text-secondary">{title}</h1>
              <p className="text-sm text-muted">{description}</p>
            </div>

            {onRetry ? (
              <Button
                fullWidth
                onClick={onRetry}
                loading={retrying}
                disabled={retrying}
              >
                Tentar novamente
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
