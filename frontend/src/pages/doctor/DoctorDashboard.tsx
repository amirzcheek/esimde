import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { appointmentsApi, getAvatarUrl } from '@/api'
import { useAuthStore } from '@/store/auth'
import { formatDate, formatTime, STATUS_LABELS, STATUS_BADGE } from '@/lib/utils'
import type { Appointment } from '@/types'
import { CalendarDays, Users, LayoutGrid, CheckCircle, UserX, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

export default function DoctorDashboard() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data: appointments = [] } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: () => appointmentsApi.doctorList().then(r => r.data as Appointment[]),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => appointmentsApi.updateStatus(id, status),
    onSuccess: () => { toast.success('Статус обновлён'); qc.invalidateQueries({ queryKey: ['doctor-appointments'] }) },
    onError: () => toast.error('Ошибка'),
  })

  const today = new Date().toISOString().slice(0, 10)
  const todayAppts = appointments.filter(a => a.date === today && ['pending','confirmed'].includes(a.status))
  const initials = [user?.first_name, user?.last_name].filter(Boolean).map(s => s![0]).join('') || '?'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {getAvatarUrl(user?.avatar_path)
            ? <img src={getAvatarUrl(user?.avatar_path)!} className="w-14 h-14 object-cover" alt="avatar" />
            : initials
          }
        </div>
        <div>
          <h1 className="text-xl font-bold">{[user?.last_name, user?.first_name].filter(Boolean).join(' ') || 'Кабинет врача'}</h1>
          <p className="text-sm text-gray-500">Добро пожаловать</p>
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { to:'/doctor/calendar', icon:<CalendarDays size={22}/>, label:'Календарь', color:'text-cyan-600 bg-cyan-50' },
          { to:'/doctor/patients', icon:<Users size={22}/>, label:'Пациенты', color:'text-purple-600 bg-purple-50' },
          { to:'/doctor/schedule', icon:<LayoutGrid size={22}/>, label:'Расписание', color:'text-blue-600 bg-blue-50' },
          { to:'/doctor/profile',  icon:<CheckCircle size={22}/>, label:'Профиль', color:'text-green-600 bg-green-50' },
        ].map(({ to, icon, label, color }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-2 py-4 bg-white border border-gray-200 rounded-2xl hover:shadow-md transition text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
            <span className="text-xs font-medium text-gray-700 leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      {/* Today's appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <CalendarDays size={18} className="text-brand-500" /> Приёмы сегодня
          </h2>
          <Link to="/doctor/calendar" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-0.5">
            Все <ChevronRight size={13} />
          </Link>
        </div>

        {todayAppts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Сегодня нет приёмов</p>
        ) : (
          <div className="space-y-3">
            {todayAppts.map(a => (
              <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                <div className="text-center w-14 flex-shrink-0">
                  <p className="font-mono text-sm font-bold text-gray-800">{formatTime(a.start_time)}</p>
                  <p className="text-xs text-gray-400">{formatTime(a.end_time)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {(a.patient as any)?.full_name || `Пациент #${a.patient_id}`}
                  </p>
                  <p className="text-xs text-gray-500">{a.type === 'online' ? '🌐 Онлайн' : '🏥 Офлайн'}</p>
                </div>
                <span className={STATUS_BADGE[a.status]}>{STATUS_LABELS[a.status]}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => statusMutation.mutate({ id: a.id, status: 'completed' })}
                    disabled={statusMutation.isPending}
                    className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition" title="Завершено">
                    <CheckCircle size={15} />
                  </button>
                  <button onClick={() => statusMutation.mutate({ id: a.id, status: 'no_show' })}
                    disabled={statusMutation.isPending}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition" title="Не явился">
                    <UserX size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
