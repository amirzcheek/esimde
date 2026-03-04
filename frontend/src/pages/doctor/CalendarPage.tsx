import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi } from '@/api'
import { formatTime, STATUS_LABELS } from '@/lib/utils'
import type { Appointment, AppointmentStatus } from '@/types'
import { ChevronLeft, ChevronRight, CheckCircle, UserX } from 'lucide-react'
import { toast } from 'sonner'

const DOW = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

function getWeekDates(offset: number): string[] {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

function fmtDay(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}`
}

const cardColor = (status: AppointmentStatus) =>
  status === 'completed'                          ? 'bg-green-50 border-green-200 text-green-800' :
  ['cancelled','no_show'].includes(status)        ? 'bg-red-50 border-red-200 text-red-800' :
                                                    'bg-blue-50 border-blue-200 text-blue-800'

const gradStyle = { background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }

export default function CalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const qc = useQueryClient()
  const days = getWeekDates(weekOffset)

  const { data: appointments = [] } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: () => appointmentsApi.doctorList().then(r => r.data as Appointment[]),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => appointmentsApi.updateStatus(id, status),
    onSuccess: () => { toast.success('Статус обновлён'); qc.invalidateQueries({ queryKey: ['doctor-appointments'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Ошибка'),
  })

  const byDay = days.reduce<Record<string, Appointment[]>>((acc, d) => {
    acc[d] = appointments.filter(a => a.date === d)
    return acc
  }, {})

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div>
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-bold text-gray-900">Календарь приёмов</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-gray-600 text-center min-w-[120px]">
            {fmtDay(days[0])} — {fmtDay(days[6])}
          </span>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Сетка — горизонтальный скролл на мобиле */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="grid grid-cols-7 gap-2 min-w-[560px]">
          {days.map((date, i) => {
            const isToday = date === today
            return (
              <div key={date} className="min-w-0">
                {/* Заголовок дня */}
                <div
                  className="text-center mb-2 py-1.5 rounded-xl text-xs font-semibold"
                  style={isToday ? gradStyle : undefined}
                >
                  <span className={isToday ? 'text-white' : 'text-gray-500'}>{DOW[i]}</span>
                  <div className={`font-bold ${isToday ? 'text-white' : 'text-gray-800'}`}>
                    {fmtDay(date)}
                  </div>
                </div>

                {/* Приёмы */}
                <div className="space-y-1.5">
                  {(byDay[date] || []).map(a => (
                    <div key={a.id} className={`border rounded-xl p-2 text-xs ${cardColor(a.status)}`}>
                      <p className="font-bold">{formatTime(a.start_time)}–{formatTime(a.end_time)}</p>
                      <p className="truncate opacity-80 mt-0.5">
                        {(a.patient as any)?.full_name || `#${a.patient_id}`}
                      </p>
                      <p className="mt-1 font-medium opacity-70">{STATUS_LABELS[a.status]}</p>
                      {['pending','confirmed'].includes(a.status) && (
                        <div className="flex gap-1 mt-1.5">
                          <button
                            onClick={() => statusMutation.mutate({ id: a.id, status: 'completed' })}
                            className="flex-1 py-0.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg flex items-center justify-center transition"
                            title="Завершить"
                          >
                            <CheckCircle size={11} />
                          </button>
                          <button
                            onClick={() => statusMutation.mutate({ id: a.id, status: 'no_show' })}
                            className="flex-1 py-0.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition"
                            title="Не явился"
                          >
                            <UserX size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {!(byDay[date] || []).length && (
                    <p className="text-gray-300 text-xs text-center pt-2">–</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
