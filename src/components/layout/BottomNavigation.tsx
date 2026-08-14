import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  NavIconAgenda,
  NavIconClientes,
  NavIconConfig,
  NavIconEntregas,
  NavIconPedidos,
  NavIconProdutos,
  NavIconQuadro,
} from './NavIcons'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { to: '/', label: 'Entregas', icon: <NavIconEntregas /> },
  { to: '/pedidos', label: 'Pedidos', icon: <NavIconPedidos /> },
  { to: '/produtos', label: 'Produtos', icon: <NavIconProdutos /> },
  { to: '/clientes', label: 'Clientes', icon: <NavIconClientes /> },
  { to: '/agenda', label: 'Agenda', icon: <NavIconAgenda /> },
  { to: '/quadro', label: 'Quadro', icon: <NavIconQuadro /> },
  { to: '/configuracoes', label: 'Config', icon: <NavIconConfig /> },
]

export function BottomNavigation() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-[900px] items-stretch justify-around overflow-x-auto px-1 pb-[env(safe-area-inset-bottom)] pt-2 sm:px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              [
                'flex min-h-12 min-w-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-button)] px-0.5 py-1 text-[10px] font-medium transition-colors duration-150 sm:min-w-0 sm:px-1 sm:text-xs',
                isActive
                  ? 'text-primary'
                  : 'text-muted hover:text-secondary',
              ].join(' ')
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
