import { Outlet } from 'react-router-dom'
import { BottomNavigation } from './BottomNavigation'

export function AppShell() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto min-h-dvh w-full max-w-[500px]">
        <main className="px-4 pb-28 pt-6 sm:px-6">
          <Outlet />
        </main>
        <BottomNavigation />
      </div>
    </div>
  )
}
