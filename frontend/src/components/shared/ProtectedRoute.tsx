import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
interface Props { children: React.ReactNode; requireDoctor?: boolean; requireAdmin?: boolean }
export default function ProtectedRoute({ children, requireDoctor, requireAdmin }: Props) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (requireDoctor && user && !user.is_doctor) return <Navigate to="/dashboard" replace />
  if (requireAdmin && user && !user.is_admin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
