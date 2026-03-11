import { useState, useEffect } from 'react'
import { auditApi, newsApi } from '@/api'

// ─── Типы ────────────────────────────────────────────────────────────────────
interface Stats {
  event_types: Record<string, number>
  auth_stats: { total_logins: number; failed_logins: number; logouts: number }
  test_stats: { total_completions: number }
  most_active_users: { user_id: number; name: string; activity_count: number }[]
}
interface LogEntry {
  id: number; user_id: number | null; user_name: string | null
  event_type: string; description: string | null
  ip_address: string | null; metadata: any; created_at: string
}
interface Patient {
  id: number; first_name: string | null; last_name: string | null
  middle_name: string | null; email: string | null; phone: string | null
  is_doctor: boolean; created_at: string
}

// ─── Вспомогательные ─────────────────────────────────────────────────────────
const GRAD = 'linear-gradient(135deg, #06b6d4, #3b82f6)'

const EVENT_LABELS: Record<string, string> = {
  login: 'Вход', logout: 'Выход', register: 'Регистрация',
  test_complete: 'Тест завершён', appointment_create: 'Запись создана',
  appointment_status_change: 'Статус записи', profile_update: 'Профиль обновлён',
  view_medical_info: 'Просмотр мед. данных',
}
const EVENT_COLORS: Record<string, string> = {
  login: 'bg-emerald-100 text-emerald-700',
  logout: 'bg-gray-100 text-gray-600',
  register: 'bg-blue-100 text-blue-700',
  test_complete: 'bg-cyan-100 text-cyan-700',
  appointment_create: 'bg-violet-100 text-violet-700',
  appointment_status_change: 'bg-amber-100 text-amber-700',
  profile_update: 'bg-orange-100 text-orange-700',
  view_medical_info: 'bg-rose-100 text-rose-700',
}

function formatDate(s: string) {
  return new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fullName(p: Patient) {
  return [p.last_name, p.first_name, p.middle_name].filter(Boolean).join(' ') || '—'
}

// ─── Статистика ───────────────────────────────────────────────────────────────
function StatsTab({ stats }: { stats: Stats | null }) {
  if (!stats) return <Spinner />

  const cards = [
    { label: 'Входов в систему',  value: stats.auth_stats.total_logins,       icon: '🔐', color: 'from-emerald-50 to-teal-50',   border: 'border-emerald-100' },
    { label: 'Неудачных входов',  value: stats.auth_stats.failed_logins,       icon: '⚠️', color: 'from-red-50 to-rose-50',       border: 'border-red-100' },
    { label: 'Тестов завершено',  value: stats.test_stats.total_completions,   icon: '🧠', color: 'from-cyan-50 to-blue-50',      border: 'border-cyan-100' },
    { label: 'Выходов',           value: stats.auth_stats.logouts,             icon: '🚪', color: 'from-gray-50 to-slate-50',     border: 'border-gray-100' },
  ]

  return (
    <div className="space-y-6">
      {/* Карточки */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.color} border ${c.border} rounded-2xl p-5`}>
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className="text-3xl font-bold text-gray-900">{c.value}</div>
            <div className="text-xs text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* События */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">События по типам</h3>
          <div className="space-y-2.5">
            {Object.entries(stats.event_types).map(([type, count]) => {
              const max = Math.max(...Object.values(stats.event_types))
              const pct = Math.round((count / max) * 100)
              return (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{EVENT_LABELS[type] ?? type}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: GRAD }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Активные пользователи */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Самые активные</h3>
          <div className="space-y-3">
            {stats.most_active_users.map((u, i) => (
              <div key={u.user_id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : GRAD }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                  <p className="text-xs text-gray-400">ID #{u.user_id}</p>
                </div>
                <span className="text-sm font-bold text-gray-700">{u.activity_count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
function LogsTab() {
  const [logs, setLogs]       = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [eventType, setEvent] = useState('')
  const [search, setSearch]   = useState('')

  const load = async (p = 1, ev = eventType) => {
    setLoading(true)
    try {
      const params: any = { page: p, per_page: 50 }
      if (ev) params.event_type = ev
      const r = await auditApi.logs(params)
      setLogs(r.data.logs); setPage(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(1) }, [])

  const filtered = search
    ? logs.filter(l =>
        l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.description?.toLowerCase().includes(search.toLowerCase()) ||
        l.ip_address?.includes(search)
      )
    : logs

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени, описанию, IP..."
          className="flex-1 min-w-48 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm outline-none focus:border-cyan-400 focus:bg-white transition-all"
        />
        <select value={eventType} onChange={e => { setEvent(e.target.value); load(1, e.target.value) }}
          className="px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm outline-none focus:border-cyan-400 transition-all">
          <option value="">Все события</option>
          {Object.entries(EVENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Таблица */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Событие</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Пользователь</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Описание</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">IP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Дата</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center"><Spinner /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-sm">Нет записей</td></tr>
              ) : filtered.map(log => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${EVENT_COLORS[log.event_type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {EVENT_LABELS[log.event_type] ?? log.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{log.user_name ?? <span className="text-gray-400">Гость</span>}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{log.description ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.ip_address ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">Страница {page}</span>
          <div className="flex gap-2">
            <button onClick={() => load(page - 1)} disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
              ← Назад
            </button>
            <button onClick={() => load(page + 1)} disabled={logs.length < 50 || loading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
              Вперёд →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Пользователи ─────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers]     = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<'all' | 'patients' | 'doctors'>('all')

  useEffect(() => {
    ;(async () => {
      try {
        const r = await auditApi.users()
        setUsers(r.data)
      } finally { setLoading(false) }
    })()
  }, [])

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      fullName(u).toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
    const matchFilter =
      filter === 'all' ? true :
      filter === 'doctors' ? u.is_doctor :
      !u.is_doctor
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени, email, телефону..."
          className="flex-1 min-w-48 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm outline-none focus:border-cyan-400 focus:bg-white transition-all"
        />
        <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50">
          {(['all','patients','doctors'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-semibold transition-all ${filter === f ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              style={filter === f ? { background: GRAD } : {}}>
              {f === 'all' ? 'Все' : f === 'patients' ? 'Пациенты' : 'Врачи'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">ФИО</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Телефон</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Роль</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Дата регистрации</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center"><Spinner /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-sm">Нет пользователей</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: GRAD }}>
                        {(u.last_name?.[0] ?? '') + (u.first_name?.[0] ?? '') || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{fullName(u)}</p>
                        <p className="text-xs text-gray-400">ID #{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{u.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${u.is_doctor ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.is_doctor ? '👨‍⚕️ Врач' : '🧑 Пациент'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ─── Главная страница ─────────────────────────────────────────────────────────

// ─── Новости ──────────────────────────────────────────────────────────────────
interface NewsItem { id: number; title: string; content: string; image_path: string | null; is_published: boolean; created_at: string }

function NewsTab() {
  const [news, setNews]       = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<NewsItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState({ title: '', content: '', is_published: true })
  const [image, setImage]     = useState<File | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = () => {
    setLoading(true)
    newsApi.adminList().then(r => setNews(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (showForm) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [showForm])

  const openCreate = () => { setEditing(null); setForm({ title: '', content: '', is_published: true }); setImage(null); setShowForm(true) }
  const openEdit   = (n: NewsItem) => { setEditing(n); setForm({ title: n.title, content: n.content, is_published: n.is_published }); setImage(null); setShowForm(true) }
  const closeForm  = () => { setShowForm(false); setEditing(null) }

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('content', form.content)
      fd.append('is_published', String(form.is_published))
      if (image) fd.append('image', image)
      if (editing) await newsApi.update(editing.id, fd)
      else await newsApi.create(fd)
      closeForm(); load()
    } finally { setSaving(false) }
  }

  const del = async (id: number) => {
    if (!confirm('Удалить новость?')) return
    await newsApi.delete(id); load()
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Всего: {news.length}</p>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
          style={{ background: GRAD }}>
          + Добавить новость
        </button>
      </div>

      {news.length === 0 ? (
        <div className="text-center py-16 text-gray-400">📰 Новостей нет</div>
      ) : (
        <div className="space-y-3">
          {news.map(n => (
            <div key={n.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-4">
              {n.image_path && (
                <img src={`/uploads/${n.image_path}`} alt="" className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${n.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {n.is_published ? 'Опубликовано' : 'Скрыто'}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm truncate">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.content}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(n)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition">Изменить</button>
                <button onClick={() => del(n.id)} className="px-3 py-1.5 rounded-lg border border-red-100 text-xs text-red-500 hover:bg-red-50 transition">Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Форма создания/редактирования */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={closeForm}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">{editing ? 'Редактировать новость' : 'Новая новость'}</h3>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Заголовок *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Заголовок новости"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 text-sm outline-none focus:border-cyan-400 focus:bg-white transition" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Текст *</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Текст новости..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 text-sm outline-none focus:border-cyan-400 focus:bg-white transition resize-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Изображение</label>
                <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-gray-100 file:text-gray-700 file:text-xs file:font-semibold hover:file:bg-gray-200" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                  className="w-4 h-4 rounded accent-cyan-500" />
                <span className="text-sm text-gray-700">Опубликовать сразу</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button onClick={closeForm} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">Отмена</button>
                <button onClick={save} disabled={saving || !form.title || !form.content}
                  className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: GRAD }}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type Tab = 'stats' | 'logs' | 'users' | 'news'

export default function AdminPage() {
  const [tab, setTab]       = useState<Tab>('stats')
  const [stats, setStats]   = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    auditApi.stats().then(r => setStats(r.data)).finally(() => setLoadingStats(false))
  }, [])

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'stats', label: 'Статистика',  icon: '📊' },
    { id: 'logs',  label: 'Audit Logs',  icon: '📋' },
    { id: 'users', label: 'Пользователи', icon: '👥' },
    { id: 'news',  label: 'Новости',       icon: '📰' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Панель администратора</h1>
          <p className="text-sm text-gray-500 mt-0.5">Мониторинг активности и управление пользователями</p>
        </div>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xl"
          style={{ background: GRAD }}>🛡️</div>
      </div>

      {/* Табы */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Контент */}
      {tab === 'stats' && <StatsTab stats={loadingStats ? null : stats} />}
      {tab === 'logs'  && <LogsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'news'  && <NewsTab />}
    </div>
  )
}
