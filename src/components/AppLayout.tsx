import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { BottomNav } from './BottomNav'

export function AppLayout({ fullWidth = false }: { fullWidth?: boolean }) {
  return (
    <div className={`app-shell${fullWidth ? ' app-shell--full' : ''}`}>
      <AppHeader />
      <Outlet />
      <BottomNav />
    </div>
  )
}
