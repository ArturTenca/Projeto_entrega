import { type ReactNode, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  NavIconAgenda,
  NavIconClientes,
  NavIconConfig,
  NavIconEntregas,
  NavIconFinanceiro,
  NavIconMenu,
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
  { to: '/financeiro', label: 'Financeiro', icon: <NavIconFinanceiro /> },
  { to: '/configuracoes', label: 'Config', icon: <NavIconConfig /> },
]

// Abas fixas no mobile: duas à esquerda e duas à direita do botão de menu.
const mobileLeft = ['/', '/pedidos']
const mobileRight = ['/agenda', '/clientes']

function pickItems(paths: string[]): NavItem[] {
  return paths
    .map((path) => navItems.find((item) => item.to === path))
    .filter((item): item is NavItem => Boolean(item))
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-button)] px-1 py-1 text-[10px] font-medium transition-colors duration-150 sm:text-xs',
    isActive ? 'text-primary' : 'text-muted hover:text-secondary',
  ].join(' ')
}

function NavItemLink({ item }: { item: NavItem }) {
  return (
    <NavLink to={item.to} end={item.to === '/'} className={navLinkClass}>
      {item.icon}
      <span>{item.label}</span>
    </NavLink>
  )
}

export function BottomNavigation() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm"
        aria-label="Navegação principal"
      >
        {/* Desktop: todas as abas */}
        <div className="mx-auto hidden max-w-[900px] items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2 sm:flex">
          {navItems.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </div>

        {/* Mobile: 4 abas principais + menu no meio */}
        <div className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)] pt-2 sm:hidden">
          {pickItems(mobileLeft).map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}

          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-sheet"
              className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-card transition-colors duration-150 hover:bg-primary-hover"
            >
              <NavIconMenu
                className={[
                  'h-6 w-6 transition-transform duration-300',
                  menuOpen ? 'rotate-90' : '',
                ].join(' ')}
              />
            </button>
          </div>

          {pickItems(mobileRight).map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </div>
      </nav>

      {/* Menu completo (mobile) */}
      <div
        className={[
          'fixed inset-0 z-40 bg-secondary/40 transition-opacity duration-300 sm:hidden',
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        id="mobile-nav-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Todas as abas"
        inert={!menuOpen}
        className={[
          'fixed bottom-0 left-0 right-0 z-40 rounded-t-[var(--radius-card-lg)] border-t border-border bg-card px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3 shadow-lg transition-transform duration-300 ease-out sm:hidden',
          menuOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="grid grid-cols-4 gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1 rounded-[var(--radius-card)] border px-1 py-3 text-xs font-medium transition-colors duration-150',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-border text-muted hover:text-secondary',
                ].join(' ')
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </>
  )
}
