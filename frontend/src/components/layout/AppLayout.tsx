import { Outlet, useLocation } from 'react-router-dom'
import AppHeader from './AppHeader'
import LandingFooter from './LandingFooter'

export default function AppLayout() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppHeader />
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      {isLanding && <LandingFooter />}
    </div>
  )
}
