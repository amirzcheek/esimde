import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { scheduleApi } from '@/api'
import type { WeekSchedule, SlotConfig } from '@/types'
import { Save } from 'lucide-react'
import { toast } from 'sonner'

const DAYS: Record<number, string> = { 1:'Пн', 2:'Вт', 3:'Ср', 4:'Чт', 5:'Пт', 6:'Сб', 7:'Вс' }
const TYPE_COLOR: Record<string, string> = {
  both: 'bg-cyan-500',
  online: 'bg-green-500',
  offline: 'bg-purple-500',
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<WeekSchedule>({})
  const [timeSlots, setTimeSlots] = useState<string[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['schedule'],
    queryFn: () => scheduleApi.get().then(r => r.data),
  })

  // v5: данные загружаем через useEffect
  useEffect(() => {
    if (data) {
      setSchedule(data.schedule || {})
      setTimeSlots(data.time_slots || [])
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () => scheduleApi.save(schedule),
    onSuccess: (r: any) => toast.success(r.data?.message || 'Расписание сохранено'),
    onError: () => toast.error('Ошибка сохранения'),
  })

  const toggle = (dow: number, ts: string) => {
    setSchedule(prev => ({
      ...prev,
      [dow]: {
        ...prev[dow],
        [ts]: {
          type: prev[dow]?.[ts]?.type || 'both',
          ...prev[dow]?.[ts],
          enabled: !prev[dow]?.[ts]?.enabled,
        },
      },
    }))
  }

  const setType = (dow: number, ts: string, type: SlotConfig['type']) => {
    setSchedule(prev => ({
      ...prev,
      [dow]: {
        ...prev[dow],
        [ts]: { ...prev[dow]?.[ts], type },
      },
    }))
  }

  const toggleDay = (dow: number) => {
    const daySlots = schedule[dow] || {}
    const allOn = timeSlots.every(ts => daySlots[ts]?.enabled)
    setSchedule(prev => ({
      ...prev,
      [dow]: Object.fromEntries(
        timeSlots.map(ts => [ts, {
          enabled: !allOn,
          type: prev[dow]?.[ts]?.type || 'both',
        }])
      ),
    }))
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Загрузка…</div>
  )

  return (
    <div className="max-w-full px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Редактор расписания</h1>
          <p className="text-sm text-gray-500 mt-1">Слоты по 1 часу, 08:00–18:00</p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold disabled:opacity-60"
          style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }}
        >
          <Save size={15} />
          {saveMutation.isPending ? 'Сохранение…' : 'Сохранить'}
        </button>
      </div>

      {/* Легенда */}
      <div className="flex items-center gap-6 mb-4 text-xs text-gray-600">
        {[
          ['bg-cyan-500',   'Оба'],
          ['bg-green-500',  'Онлайн'],
          ['bg-purple-500', 'Офлайн'],
          ['bg-gray-200',   'Выкл'],
        ].map(([cls, lbl]) => (
          <div key={lbl} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${cls}`} />
            {lbl}
          </div>
        ))}
      </div>

      {/* Таблица */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 bg-gray-50 z-10 px-3 py-3 text-left font-medium text-gray-600 w-24 border-b border-r">
                День
              </th>
              {timeSlots.map(ts => (
                <th key={ts} className="px-2 py-3 text-center font-mono font-medium text-gray-600 border-b border-r last:border-r-0 min-w-[64px]">
                  {ts}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7].map(dow => (
              <tr key={dow} className="border-b last:border-b-0 hover:bg-gray-50/50">
                <td className="sticky left-0 bg-white z-10 px-3 py-2 border-r">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-gray-700">{DAYS[dow]}</span>
                    <button
                      onClick={() => toggleDay(dow)}
                      className="text-[10px] px-2 py-1 text-white rounded-md"
                      style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }}
                    >
                      Вкл/Выкл
                    </button>
                  </div>
                </td>
                {timeSlots.map(ts => {
                  const slot = schedule[dow]?.[ts]
                  const enabled = slot?.enabled
                  const type = slot?.type || 'both'
                  return (
                    <td key={ts} className="p-1.5 border-r last:border-r-0">
                      {/* Ячейка слота */}
                      <button
                        onClick={() => toggle(dow, ts)}
                        title={enabled ? `Выключить ${ts}` : `Включить ${ts}`}
                        className={`w-full h-8 rounded-lg transition-all hover:opacity-75 active:scale-95 ${
                          enabled ? TYPE_COLOR[type] : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      />
                      {/* Выбор типа */}
                      {enabled && (
                        <div className="flex gap-0.5 mt-1">
                          {(['both', 'online', 'offline'] as const).map(t => (
                            <button
                              key={t}
                              onClick={() => setType(dow, ts, t)}
                              className={`flex-1 py-0.5 rounded text-[9px] font-medium transition-all ${
                                type === t
                                  ? `${TYPE_COLOR[t]} text-white`
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              {t === 'both' ? 'Оба' : t === 'online' ? 'Он' : 'Оф'}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Нажмите на ячейку чтобы включить/выключить слот. После настройки нажмите «Сохранить».
      </p>
    </div>
  )
}
