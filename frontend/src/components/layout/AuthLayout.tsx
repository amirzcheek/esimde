import { Link } from 'react-router-dom'

interface Props { children: React.ReactNode }

export default function AuthLayout({ children }: Props) {
  return (
    <main className="grid grid-cols-1 md:grid-cols-2 h-screen p-4 gap-4">
      <div className="flex flex-col">
        <div className="flex items-center">
          <Link
            to="/"
            className="font-bold text-3xl"
            style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            esimde
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center h-full">
          {children}
        </div>
      </div>
      <div className="hidden md:block w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-cyan-100 to-blue-200">
        {/* Placeholder for home.png */}
        <div className="w-full h-full flex items-center justify-center opacity-30">
          <span style={{ fontSize: '8rem' }}>🧠</span>
        </div>
      </div>
    </main>
  )
}
