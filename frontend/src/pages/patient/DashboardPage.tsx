import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { usersApi, appointmentsApi, getAvatarUrl, memoriesApi } from '@/api'
import { toast } from 'sonner'
import type { Me, Appointment, Conclusion, Test } from '@/types'


// ─── Быстрое добавление воспоминания ─────────────────────────────────────────
function MemoryQuickAdd() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', title.trim())
      fd.append('description', desc.trim())
      if (imageFile) fd.append('image', imageFile)
      await memoriesApi.create(fd)
      setTitle(''); setDesc(''); setImageFile(null); setPreview(null); setOpen(false)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-amber-100 rounded-2xl overflow-hidden shadow-sm">
      {/* Шапка */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-amber-50 transition"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">📖</span>
          <span className="text-sm font-semibold text-gray-800">Дневник воспоминаний</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/memories"
            onClick={e => e.stopPropagation()}
            className="text-xs text-amber-500 hover:underline font-medium"
          >
            Все →
          </Link>
          <span className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </div>

      {/* Форма быстрого добавления */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-amber-50 pt-3">
          {/* Фото */}
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full h-28 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50 cursor-pointer hover:border-amber-400 transition overflow-hidden flex items-center justify-center"
          >
            {preview ? (
              <img src={preview} className="w-full h-full object-cover" alt="preview" />
            ) : (
              <div className="text-center text-amber-300">
                <div className="text-2xl mb-1">📷</div>
                <p className="text-xs">Добавить фото</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>

          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            placeholder="Название (Мама, Дача, Свадьба...)"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <textarea
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
            rows={2}
            placeholder="Описание..."
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="w-full py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
          >
            {saving ? 'Сохраняю...' : '+ Сохранить воспоминание'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user: authUser } = useAuthStore()
  const [user, setUser] = useState<Me | null>(null)
  const [lastTest, setLastTest] = useState<Test | null>(null)
  const [latestConclusion, setLatestConclusion] = useState<Conclusion | null>(null)
  const [nearestAppointment, setNearestAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [randomMemory, setRandomMemory] = useState<{ id: number; title: string; description: string | null; image_path: string | null } | null>(() => {
    // Восстанавливаем воспоминание из localStorage если пациент ещё не ответил
    try {
      const saved = localStorage.getItem('memory_pending')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [memoryAnswer, setMemoryAnswer] = useState<'yes' | 'no' | null>(null)
  const [error, setError] = useState('')
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('rec_checked') || '{}') } catch { return {} }
  })
  const toggleCheck = (key: string) => {
    setChecked(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem('rec_checked', JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    usersApi.getProfile()
      .then(r => {
        setUser(r.data.user)
        setLastTest(r.data.last_test)
        setLatestConclusion(r.data.latest_conclusion)
        setNearestAppointment(r.data.nearest_appointment)
      })
      .catch(e => {
        console.error('profile error', e)
        setError('Не удалось загрузить профиль')
      })
      .finally(() => setLoading(false))

    // Логика воспоминания:
    // - показываем при каждом заходе если нет pending
    // - если pending есть (не ответил) — оставляем его
    // - если ответил — показываем новое через 3 часа
    const MEMORY_INTERVAL_MS = 3 * 60 * 60 * 1000
    const pending = localStorage.getItem('memory_pending')
    const lastMemoryTs = parseInt(localStorage.getItem('memory_last_ts') || '0')
    const shouldLoad = !pending && (Date.now() - lastMemoryTs >= MEMORY_INTERVAL_MS)

    if (shouldLoad) {
      memoriesApi.random()
        .then(res => {
          if (res.data) {
            setRandomMemory(res.data)
            localStorage.setItem('memory_pending', JSON.stringify(res.data))
            // НЕ обновляем memory_last_ts пока не ответит
          }
        })
        .catch(() => {})
    }
  }, [])

  const initials = user
    ? `${user.last_name?.[0] ?? ''}${user.first_name?.[0] ?? ''}`
    : authUser ? `${authUser.last_name?.[0] ?? ''}${authUser.first_name?.[0] ?? ''}` : ''

  const displayName = user
    ? `${user.last_name ?? ''} ${user.first_name?.[0] ?? ''}.${user.middle_name?.[0] ? ' ' + user.middle_name[0] + '.' : ''}`
    : authUser ? `${authUser.last_name ?? ''} ${authUser.first_name?.[0] ?? ''}.` : ''

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-gray-400 text-sm">Загрузка...</div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-red-500 text-sm">{error}</div>
    </div>
  )

  return (
    <section className="container max-w-7xl mx-auto py-6 px-4">
      <div className="flex flex-col lg:flex-row items-start gap-6">

        {/* Main */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div>
              <p className="text-sm text-gray-400">Здравствуйте,</p>
              <h1 className="font-bold text-2xl text-gray-900">{user?.first_name || 'Пациент'} 👋</h1>
            </div>
            <Link to="/dashboard/settings" className="ml-auto text-gray-400 hover:text-blue-500 transition p-2 rounded-xl hover:bg-gray-50">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              </svg>
            </Link>
          </div>

{/* Блок случайного воспоминания */}
          {randomMemory && memoryAnswer === null && (
            <div className="bg-white border border-amber-100 rounded-2xl p-5 mb-4 shadow-sm">
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-3">🧠 Тренировка памяти</p>
              <div className="flex gap-4 items-start">
                {randomMemory.image_path && (
                  <img
                    src={getAvatarUrl(randomMemory.image_path)!}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    alt={randomMemory.title}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 mb-1">Помните ли вы это?</p>
                  <h3 className="font-bold text-gray-900 text-base mb-1">{randomMemory.title}</h3>
                  {randomMemory.description && (
                    <p className="text-xs text-gray-400 line-clamp-2">{randomMemory.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setMemoryAnswer('yes')
                    localStorage.removeItem('memory_pending')
                    localStorage.setItem('memory_last_ts', String(Date.now()))
                  }}
                  className="flex-1 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition"
                >
                  ✅ Помню!
                </button>
                <button
                  onClick={() => {
                    setMemoryAnswer('no')
                    localStorage.removeItem('memory_pending')
                    localStorage.setItem('memory_last_ts', String(Date.now()))
                  }}
                  className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition"
                >
                  🤔 Не помню
                </button>
              </div>
            </div>
          )}
          {randomMemory && memoryAnswer === 'yes' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <p className="text-sm text-green-700 font-medium">Отлично! Ваша память работает хорошо.</p>
            </div>
          )}
          {randomMemory && memoryAnswer === 'no' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
              <span className="text-2xl">💛</span>
              <div>
                <p className="text-sm text-amber-700 font-medium">Ничего страшного.</p>
                <p className="text-xs text-amber-600 mt-0.5">Загляните в <a href="/dashboard/memories" className="underline font-semibold">дневник воспоминаний</a>, чтобы освежить память.</p>
              </div>
            </div>
          )}

          {/* Рекомендации врача — чеклист */}
          {latestConclusion && (() => {
            const items = [
              latestConclusion.examination_recommendations && { key: 'exam', emoji: '🔬', label: 'Анализы', text: latestConclusion.examination_recommendations },
              latestConclusion.diet_recommendations        && { key: 'diet', emoji: '🥗', label: 'Питание', text: latestConclusion.diet_recommendations },
              latestConclusion.medications                 && { key: 'meds', emoji: '💊', label: 'Лекарства', text: latestConclusion.medications },
            ].filter(Boolean) as { key: string; emoji: string; label: string; text: string }[]
            if (!items.length) return null
            const doneCount = items.filter(i => checked[i.key]).length
            return (
              <div className="bg-white border border-blue-100 rounded-2xl p-5 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                    🩺 Рекомендации врача
                  </h3>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                    {doneCount}/{items.length} выполнено
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.key}
                      onClick={() => toggleCheck(item.key)}
                      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all select-none
                        ${checked[item.key] ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-100 hover:border-blue-200'}`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                        ${checked[item.key] ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                        {checked[item.key] && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span>{item.emoji}</span>
                          <span className={`text-sm font-semibold ${checked[item.key] ? 'text-green-700 line-through' : 'text-gray-800'}`}>{item.label}</span>
                        </div>
                        <p className={`text-xs leading-relaxed whitespace-pre-line ${checked[item.key] ? 'text-green-600' : 'text-gray-500'}`}>{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Активная запись с кнопкой отмены */}
          {nearestAppointment && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-blue-700 mb-1 flex items-center gap-2">
                    <span>📅</span> Ближайший приём
                  </h3>
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">
                      {new Date(nearestAppointment.date + 'T00:00:00').toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'long'
                      })}
                    </span>
                    {' в '}
                    <span className="font-medium">{nearestAppointment.start_time}</span>
                    {(nearestAppointment.doctor as any)?.full_name && (
                      <div className="mt-0.5 text-blue-600">
                        — {(nearestAppointment.doctor as any).full_name}
                      </div>
                    )}
                    {nearestAppointment.type && (
                      <div className="mt-0.5 text-xs text-blue-500">
                        {nearestAppointment.type === 'online' ? '🌐 Онлайн' : '🏥 Офлайн'}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm('Отменить запись?')) return
                    try {
                      await appointmentsApi.cancel(nearestAppointment.id)
                      toast.success('Запись отменена')
                      setNearestAppointment(null)
                    } catch (e: any) {
                      toast.error(e?.response?.data?.detail || 'Ошибка отмены')
                    }
                  }}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition"
                >
                  Отменить
                </button>
              </div>
            </div>
          )}

          {/* Предварительное заключение */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-blue-500 text-sm">Предварительное заключение</h3>
            </div>
            {user?.preliminary_conclusion ? (
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{user.preliminary_conclusion}</div>
            ) : (
              <p className="text-sm text-gray-500">Заключение пока не заполнено.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-1/3 flex flex-col space-y-4">

          {/* Результат теста */}
          {lastTest ? (
            <div className="bg-white border border-zinc-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-zinc-800">Результат теста</div>
                <div className="text-xl font-bold text-blue-600">{lastTest.neurocognitive_score}%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${lastTest.neurocognitive_score}%`,
                    background: 'linear-gradient(to right, #06b6d4, #3b82f6)'
                  }}
                />
              </div>
              <div className="flex items-center gap-3 mt-1">
                <Link to={`/report/${lastTest.hash}`} className="text-xs text-cyan-500 hover:underline">
                  Посмотреть отчёт →
                </Link>
                <Link to="/test/go" className="text-xs text-gray-400 hover:text-gray-600 hover:underline">
                  Пройти заново
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 mb-3">Вы ещё не проходили тест</p>
              <Link to="/test" className="text-sm text-cyan-500 hover:underline">Пройти тест →</Link>
            </div>
          )}

          {/* Кнопки */}
          <Link
            to="/appointment"
            className="inline-flex items-center justify-center rounded-full p-0.5 transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }}
          >
            <div className="flex items-center justify-center w-full rounded-full px-4 py-3">
              <span className="font-semibold text-white text-sm">Записаться на приём</span>
            </div>
          </Link>

          {/* <Link
            to="/voice-assistant"
            className="inline-flex items-center justify-center rounded-full border border-cyan-300 px-4 py-3 text-sm font-semibold text-cyan-600 hover:bg-cyan-50 transition"
          >
            🎙 Голосовой ассистент
          </Link> */}

          <Link
            to="/dashboard/settings"
            className="inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            📄 Загрузить анализы
          </Link>

          {/* Карточка быстрого добавления воспоминания */}
          <MemoryQuickAdd />
        </div>
      </div>
    </section>
  )
}
