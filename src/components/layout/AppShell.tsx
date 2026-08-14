import { Outlet, useLocation } from 'react-router-dom'
import { BottomNavigation } from './BottomNavigation'

export function AppShell() {
  const { pathname } = useLocation()
  const isQuadro = pathname === '/quadro'

  return (
    <div className="min-h-dvh bg-background">
      <div
        className={[
          'mx-auto min-h-dvh w-full',
          isQuadro ? 'max-w-none' : 'max-w-[500px]',
        ].join(' ')}
      >
        <main
          className={
            isQuadro
              ? 'flex h-dvh flex-col overflow-hidden px-3 pb-24 pt-4 sm:px-6 md:px-8'
              : 'px-4 pb-28 pt-6 sm:px-6'
          }
        >
          <Outlet />
        </main>
        <BottomNavigation />
      </div>
    </div>
  )
}
