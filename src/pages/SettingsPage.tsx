import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/AuthProvider'

export function SettingsPage() {
  const { user, signOut } = useAuth()
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
