import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { authApi, getAvatarUrl } from '@/api'
import { useState, useEffect, useRef } from 'react'
import { Menu, X } from 'lucide-react'

export default function AppHeader() {
  const { user, token, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
  }, [location.pathname])

  const isDoctor  = user?.is_doctor
  const isAdmin   = user?.is_admin
  const isPatient = token && !isDoctor && !isAdmin

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/')
  }

  const initials = user ? `${user.last_name?.[0] ?? ''}${user.first_name?.[0] ?? ''}` : ''
  const displayName = user ? `${user.last_name ?? ''} ${user.first_name?.[0] ?? ''}.` : ''
  const gradStyle = { background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }

  const navLinks = isDoctor ? [
    { to: '/doctor/patients', label: 'Пациенты' },
    { to: '/doctor/schedule', label: 'Расписание' },
    { to: '/doctor/calendar', label: 'Календарь' },
  ] : isPatient ? [
    { to: '/dashboard',   label: 'Профиль' },
    { to: '/appointment', label: 'Запись' },
    { to: '/news',        label: 'Новости' },
  ] : isAdmin ? [
    { to: '/admin/audit', label: 'Аудит' },
    { to: '/news',        label: 'Новости' },
  ] : [
    { to: '/#about',    label: 'О нас' },
    { to: '/news',      label: 'Новости' },
    { to: '/#contacts', label: 'Контакты' },
  ]

  return (
    <div className="sticky top-0 z-50">
      <header className="h-14 border-b border-gray-100 bg-white">
        <div className="flex items-center h-full max-w-7xl mx-auto px-4 gap-4">

          {/* Логотип */}
          <Link
            to={token ? (isDoctor ? '/doctor' : '/dashboard') : '/'}
            className="font-bold text-2xl flex-shrink-0"
            style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            esimde
          </Link>

          {/* Десктоп nav */}
          <nav className="hidden md:flex items-center gap-6 ml-8">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} className="text-sm font-medium text-gray-600 hover:text-cyan-600 transition">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Правая часть */}
          <div className="flex items-center gap-3 ml-auto">
            {token ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-cyan-600 transition"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
                    {getAvatarUrl(user?.avatar_path)
                      ? <img src={getAvatarUrl(user?.avatar_path)!} className="w-8 h-8 object-cover" alt="avatar" />
                      : initials
                    }
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate">{displayName}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <Link
                      to={isDoctor ? '/doctor/profile' : '/dashboard/settings'}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Мой профиль
                    </Link>
                    <hr className="border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                    >
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-cyan-600 transition">
                Войти
              </Link>
            )}

            {/* Бургер — только мобиль */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition"
              onClick={() => setMobileMenuOpen(o => !o)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Мобильное меню */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-sm">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className="py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
