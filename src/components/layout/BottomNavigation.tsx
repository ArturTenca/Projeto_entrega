import { NavLink } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { to: '/', label: 'Entregas', icon: '📦' },
  { to: '/pedidos', label: 'Pedidos', icon: '📋' },
  { to: '/produtos', label: 'Produtos', icon: '🥚' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
  { to: '/agenda', label: 'Agenda', icon: '📅' },
  { to: '/configuracoes', label: 'Config', icon: '⚙️' },
]

export function BottomNavigation() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-[1400px] items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              [
                'flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-button)] px-1 py-1 text-[10px] font-medium transition-colors duration-150 sm:text-xs',
                isActive
                  ? 'text-primary'
                  : 'text-muted hover:text-secondary',
              ].join(' ')
            }
          >
            <span className="text-lg leading-none" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
