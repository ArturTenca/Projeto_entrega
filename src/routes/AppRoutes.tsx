import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import {
  ProtectedRoute,
  PublicOnlyRoute,
} from '@/features/auth/ProtectedRoute'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { ClientesPage } from '@/pages/ClientesPage'
import { PedidosPage } from '@/pages/PedidosPage'
import { AgendaPage } from '@/pages/AgendaPage'
import { ProdutosPage } from '@/pages/ProdutosPage'
import { SettingsPage } from '@/pages/SettingsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="pedidos" element={<PedidosPage />} />
          <Route path="produtos" element={<ProdutosPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
