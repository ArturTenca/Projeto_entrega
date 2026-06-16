import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/AuthProvider'
import { useTheme } from '@/features/theme/ThemeProvider'

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    await signOut()
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-secondary">Configurações</h1>
        <p className="mt-1 text-sm text-muted">Conta e preferências</p>
      </header>

      <Card variant="important">
        <p className="text-sm text-muted">Usuário conectado</p>
        <p className="mt-1 font-medium text-secondary">{user?.email}</p>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-secondary">Modo escuro</p>
            <p className="mt-1 text-sm text-muted">
              Salvo neste navegador.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Alternar modo escuro"
            onClick={toggleTheme}
            className={[
              'relative h-8 w-14 shrink-0 rounded-full transition-colors duration-150',
              theme === 'dark' ? 'bg-primary' : 'bg-border',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-1 left-1 h-6 w-6 rounded-full bg-card shadow transition-transform duration-150',
                theme === 'dark' ? 'translate-x-6' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>
      </Card>

      <Button
        variant="danger"
        fullWidth
        loading={loading}
        onClick={() => void handleSignOut()}
      >
        Sair
      </Button>
    </div>
  )
}
