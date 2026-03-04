import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { usersApi, authApi, analysesApi, getAvatarUrl } from '@/api'
import { toast } from 'sonner'
import { Save, Upload, Trash2, FileText, Camera } from 'lucide-react'
import type { Analysis } from '@/types'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const fileInputRef  = useRef<HTMLInputElement>(null) // анализы
  const avatarInputRef = useRef<HTMLInputElement>(null) // аватар

  const [form, setForm] = useState({
    first_name:  user?.first_name  || '',
    last_name:   user?.last_name   || '',
    middle_name: user?.middle_name || '',
    birth_date:  '',
    height:      user?.height      || '',
    weight:      user?.weight      || '',
    phone:       user?.phone       || '',
  })

  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [uploading, setUploading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [description, setDescription] = useState('')

  useEffect(() => {
    usersApi.getProfile().then(r => {
      const u = r.data.user
      setForm({
        first_name:  u.first_name  || '',
        last_name:   u.last_name   || '',
        middle_name: u.middle_name || '',
        birth_date:  u.birth_date  || '',
        height:      u.height      || '',
        weight:      u.weight      || '',
        phone:       u.phone       || '',
      })
    }).catch(() => {})
    loadAnalyses()
  }, [])

  const loadAnalyses = () => {
    analysesApi.list().then(r => setAnalyses(r.data)).catch(() => {})
  }

  // Сохранение профиля
  const profileMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = { ...form }
      if (!payload.birth_date) payload.birth_date = null
      if (!payload.middle_name) payload.middle_name = null
      return usersApi.updateProfile(payload)
    },
    onSuccess: async () => {
      try { const me = await authApi.me(); setUser(me.data as any) } catch {}
      toast.success('Профиль обновлён')
    },
    onError: () => toast.error('Ошибка при сохранении'),
  })

  // Загрузка аватара
  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    try {
      await usersApi.uploadAvatar(file)
      const me = await authApi.me()
      setUser(me.data as any)
      toast.success('Фото обновлено')
    } catch {
      toast.error('Ошибка загрузки фото')
    } finally {
      setAvatarLoading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  // Загрузка анализа
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await analysesApi.upload(file, description || undefined)
      toast.success('Анализ загружен')
      setDescription('')
      loadAnalyses()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Ошибка загрузки')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteAnalysis = async (id: number) => {
    if (!confirm('Удалить анализ?')) return
    try {
      await analysesApi.delete(id)
      toast.success('Удалено')
      setAnalyses(prev => prev.filter(a => a.id !== id))
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  const field = (key: string, label: string, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <input
        type={type}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-blue-50 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
        value={(form as any)[key]}
        placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  )

  const gradStyle = { background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }
  const initials = [user?.last_name, user?.first_name].filter(Boolean).map(s => s![0]).join('') || '?'

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">

      {/* Аватар */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-3">
        <div className="relative">
          {getAvatarUrl(user?.avatar_path) ? (
            <img
              src={getAvatarUrl(user?.avatar_path)!}
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              alt="avatar"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold"
              style={gradStyle}
            >
              {initials}
            </div>
          )}
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarLoading}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition"
          >
            <Camera size={14} className="text-gray-500" />
          </button>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatar}
          className="hidden"
        />
        <p className="text-xs text-gray-400">
          {avatarLoading ? 'Загрузка...' : 'Нажмите на камеру чтобы изменить фото'}
        </p>
      </div>

      {/* Профиль */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-4">Личные данные</h1>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          {field('last_name',   'Фамилия',       'text', 'Иванов')}
          {field('first_name',  'Имя',           'text', 'Иван')}
          {field('middle_name', 'Отчество',      'text', 'Иванович')}

          {/* Телефон с префиксом +7 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Телефон</label>
            <div className="flex items-center rounded-xl border border-gray-200 bg-blue-50 overflow-hidden focus-within:ring-2 focus-within:ring-cyan-300">
              <span className="px-3 text-sm text-gray-500 font-medium select-none border-r border-gray-200 bg-blue-100 py-2.5">+7</span>
              <input
                type="tel"
                className="flex-1 px-3 py-2.5 bg-transparent text-sm outline-none"
                placeholder="700 000 00 00"
                maxLength={13}
                value={(form.phone || '').replace(/^\+?7?/, '')}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setForm(f => ({ ...f, phone: digits ? `+7${digits}` : '' }))
                }}
              />
            </div>
          </div>

          {field('birth_date',  'Дата рождения', 'date')}
          <div className="grid grid-cols-2 gap-3">
            {field('height', 'Рост (см)', 'text', '175')}
            {field('weight', 'Вес (кг)',  'text', '70')}
          </div>
          <button
            onClick={() => profileMutation.mutate()}
            disabled={profileMutation.isPending}
            className="w-full flex items-center justify-center gap-2 rounded-full py-2.5 text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-60"
            style={gradStyle}
          >
            <Save size={15} />
            {profileMutation.isPending ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* Анализы */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Мои анализы</h2>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Описание (необязательно)
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-blue-50 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                placeholder="Например: Общий анализ крови"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 rounded-full py-2.5 text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-60"
              style={gradStyle}
            >
              <Upload size={15} />
              {uploading ? 'Загрузка…' : 'Выбрать файл и загрузить'}
            </button>
            <p className="text-xs text-gray-400 text-center">PDF, JPG, PNG, DOC — до 10 МБ</p>
          </div>

          {analyses.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm border-t border-gray-100">
              Анализы ещё не загружены
            </div>
          ) : (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {analyses.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <FileText size={18} className="text-cyan-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{a.file_name}</p>
                    {a.description && (
                      <p className="text-xs text-gray-500 truncate">{a.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(a.uploaded_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAnalysis(a.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
