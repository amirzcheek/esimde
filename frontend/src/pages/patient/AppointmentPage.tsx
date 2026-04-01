import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { doctorsApi, appointmentsApi } from '@/api'
import type { Doctor, DayInfo, SlotGroup } from '@/types'
import { ChevronLeft, ChevronRight, X, MapPin } from 'lucide-react'
import { toast } from 'sonner'

const gradStyle = { background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }

function formatDateLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

export default function AppointmentPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Список врачей
  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.list().then(r => r.data),
  })

  // Автовыбор первого врача — через useEffect
  useEffect(() => {
    if (doctors.length && !selectedDoctor) {
      setSelectedDoctor(doctors[0].id)
    }
  }, [doctors])

  // Слоты на неделю
  const { data: weekData } = useQuery({
    queryKey: ['week-slots', selectedDoctor, weekOffset],
    queryFn: () => appointmentsApi.weekSlots(selectedDoctor!, weekOffset).then(r => r.data),
    enabled: !!selectedDoctor,
  })

  // Слоты на день
  const { data: dayData, isLoading: dayLoading } = useQuery({
    queryKey: ['day-slots', selectedDoctor, selectedDate],
    queryFn: () => appointmentsApi.daySlots(selectedDoctor!, selectedDate!).then(r => r.data),
    enabled: !!selectedDoctor && !!selectedDate,
  })

  const [consents, setConsents] = useState({ terms: false, privacy: false, refund: false })
  const allConsented = consents.terms && consents.privacy && consents.refund

  const bookMutation = useMutation({
    mutationFn: (slotId: number) => appointmentsApi.book(slotId),
    onSuccess: () => {
      toast.success('Запись создана!')
      qc.invalidateQueries({ queryKey: ['active-appointment'] })
      navigate('/dashboard')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Ошибка при записи'),
  })

  const days: DayInfo[] = weekData?.days || []
  const slots: SlotGroup[] = dayData?.slots || []
  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor)

  const selectDay = (date: string, hasSlots: boolean) => {
    if (!hasSlots) return
    setSelectedDate(date)
    setSelectedSlot(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedSlot(null)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Запись к врачу</h1>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Список врачей */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Выберите врача</p>
          {doctors.map(doc => (
            <button
              key={doc.id}
              onClick={() => { setSelectedDoctor(doc.id); setWeekOffset(0); setSelectedDate(null) }}
              className={`w-full text-left p-4 rounded-2xl border transition-all hover:shadow-md ${
                selectedDoctor === doc.id
                  ? 'border-cyan-400 bg-cyan-50'
                  : 'border-gray-200 bg-white hover:border-cyan-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={gradStyle}
                >
                  {doc.first_name?.[0]}{doc.last_name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{doc.full_name}</p>
                  <p className="text-xs text-gray-500">{doc.position || 'Врач'}</p>
                  {doc.experience_years && (
                    <p className="text-xs text-gray-400">Стаж: {doc.experience_years} лет</p>
                  )}
                  {doc.address && (
                    <p className="text-xs text-cyan-600 flex items-center gap-0.5 mt-0.5">
                      <MapPin size={10} />
                      <span className="truncate">{doc.address}</span>
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Календарь */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            {!selectedDoctor ? (
              <p className="text-center text-gray-400 text-sm py-8">Выберите врача слева</p>
            ) : (
              <>
                {/* Навигация по неделям */}
                <div className="flex items-center justify-between mb-5">
                  <button
                    onClick={() => setWeekOffset(w => w - 1)}
                    disabled={weekOffset <= 0}
                    className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-30 transition"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    {days[0]?.date && formatDateLabel(days[0].date)}
                    {' — '}
                    {days[6]?.date && formatDateLabel(days[6].date)}
                  </span>
                  <button
                    onClick={() => setWeekOffset(w => w + 1)}
                    className="p-2 rounded-xl hover:bg-gray-100 transition"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Дни недели */}
                <div className="grid grid-cols-7 gap-2">
                  {days.map(day => {
                    const isSelected = selectedDate === day.date
                    const available = day.has_slots && !day.is_past
                    return (
                      <button
                        key={day.date}
                        onClick={() => selectDay(day.date, day.has_slots)}
                        disabled={!available}
                        className={`p-2 rounded-xl text-center text-xs transition-all ${
                          isSelected
                            ? 'text-white'
                            : available
                            ? 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 cursor-pointer'
                            : 'text-gray-300 cursor-not-allowed bg-gray-50'
                        }`}
                        style={isSelected ? gradStyle : {}}
                      >
                        <div className="font-semibold">{day.label.split(',')[0]}</div>
                        <div className="text-[10px] mt-0.5 opacity-80">
                          {formatDateLabel(day.date)}
                        </div>
                        {available && (
                          <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${
                            isSelected ? 'bg-white/70' : 'bg-cyan-400'
                          }`} />
                        )}
                      </button>
                    )
                  })}
                </div>

                {days.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-4">Нет данных</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Модал выбора времени */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg text-gray-900">
                {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'long'
                })}
              </h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {dayLoading ? (
              <p className="text-center text-gray-400 text-sm py-6">Загрузка слотов…</p>
            ) : slots.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-6">Нет доступных слотов на этот день</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {slots.map(slot => (
                  <div key={slot.time} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <span className="font-mono text-sm font-semibold text-gray-800 w-24 flex-shrink-0">
                      {slot.time} – {slot.end}
                    </span>
                    <div className="flex gap-2 flex-1">
                      {slot.types.offline !== undefined && (
                        <button
                          onClick={() => setSelectedSlot(slot.types.offline!)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            selectedSlot === slot.types.offline
                              ? 'text-white border-transparent'
                              : 'bg-white border-gray-200 hover:border-cyan-300 text-gray-700'
                          }`}
                          style={selectedSlot === slot.types.offline ? gradStyle : {}}
                        >
                          🏥 Офлайн
                        </button>
                      )}
                      {slot.types.online !== undefined && (
                        <button
                          onClick={() => setSelectedSlot(slot.types.online!)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            selectedSlot === slot.types.online
                              ? 'text-white border-transparent'
                              : 'bg-white border-gray-200 hover:border-cyan-300 text-gray-700'
                          }`}
                          style={selectedSlot === slot.types.online ? gradStyle : {}}
                        >
                          🌐 Онлайн
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Чекбоксы согласия */}
            <div className="mt-4 space-y-2 border-t pt-4">
              {[
                { key: 'terms',   label: 'Я ознакомился(-ась) с', link: '/agreement',  linkText: 'пользовательским соглашением' },
                { key: 'privacy', label: 'Я ознакомился(-ась) с', link: '/privacy',  linkText: 'политикой конфиденциальности' },
                { key: 'refund',  label: 'Я ознакомился(-ась) с', link: '/refund',   linkText: 'условиями возврата и отмены' },
              ].map(({ key, label, link, linkText }) => (
                <label key={key} className="flex items-start gap-2 cursor-pointer text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={consents[key as keyof typeof consents]}
                    onChange={e => setConsents(p => ({ ...p, [key]: e.target.checked }))}
                    className="mt-0.5 flex-shrink-0 accent-cyan-500"
                  />
                  <span>{label} <a href={link} target="_blank" rel="noreferrer" className="text-cyan-600 hover:underline" onClick={e => e.stopPropagation()}>{linkText}</a> и согласен(-на) с ними</span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={() => selectedSlot && bookMutation.mutate(selectedSlot)}
                disabled={!selectedSlot || bookMutation.isPending || !allConsented}
                className="flex-1 py-2.5 rounded-full text-white text-sm font-semibold disabled:opacity-50 transition"
                style={gradStyle}
              >
                {bookMutation.isPending ? 'Запись…' : 'Записаться'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
