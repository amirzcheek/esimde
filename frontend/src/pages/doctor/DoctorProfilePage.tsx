import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { usersApi, authApi, getAvatarUrl } from '@/api'
import { toast } from 'sonner'
import { Save, Camera } from 'lucide-react'

export default function DoctorProfilePage() {
  const { user, setUser } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)

  const [form, setForm] = useState({
    first_name:       user?.first_name   || '',
    last_name:        user?.last_name    || '',
    middle_name:      user?.middle_name  || '',
    position:         '',
    experience_years: '',
    address:          '',
    city:             '',
    phone:            '',
  })

  useEffect(() => {
    authApi.me().then(r => {
      const u = r.data
      setForm({
        first_name:       u.first_name   || '',
        last_name:        u.last_name    || '',
        middle_name:      u.middle_name  || '',
        position:         (u as any).position         || '',
        experience_years: (u as any).experience_years || '',
        address:          (u as any).address          || '',
        city:             (u as any).city             || '',
        phone:            (u as any).phone            || '',
      })
    }).catch(() => {})
  }, [])

  const profileMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = { ...form }
      if (!payload.middle_name) payload.middle_name = null
      if (!payload.experience_years) payload.experience_years = null
      else payload.experience_years = Number(payload.experience_years)
      return usersApi.updateDoctorProfile(payload)
    },
    onSuccess: async () => {
      try { const me = await authApi.me(); setUser(me.data as any) } catch {}
      toast.success('Профиль обновлён')
    },
    onError: () => toast.error('Ошибка при сохранении'),
  })

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
      if (fileInputRef.current) fileInputRef.current.value = ''
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
    <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Профиль врача</h1>

      {/* Аватар */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-4">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={gradStyle}
          >
            {getAvatarUrl(user?.avatar_path) ? (
              <img src={getAvatarUrl(user?.avatar_path)!} className="w-20 h-20 rounded-full object-cover" alt="avatar" />
            ) : initials}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarLoading}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:bg-gray-50"
          >
            <Camera size={13} className="text-gray-500" />
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
        <p className="text-xs text-gray-400">JPG, PNG до 5 МБ</p>
      </div>

      {/* Личные данные */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm">Личные данные</h2>
        {field('last_name',   'Фамилия',  'text', 'Иванов')}
        {field('first_name',  'Имя',      'text', 'Иван')}
        {field('middle_name', 'Отчество', 'text', 'Иванович')}

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

        {field('city', 'Город', 'text', 'Алматы')}
      </div>

      {/* Профессиональные данные */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm">Профессиональные данные</h2>
        {field('position',         'Специализация', 'text',   'Невролог')}
        {field('experience_years', 'Стаж (лет)',    'number', '10')}
        {field('address',          'Адрес клиники', 'text',   'ул. Абая 1')}
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
  )
}
