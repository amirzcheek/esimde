import { useEffect, useRef, useState } from 'react'
import { memoriesApi, getAvatarUrl } from '@/api'
import { toast } from 'sonner'

interface Memory {
  id: number
  title: string
  description: string | null
  image_path: string | null
  created_at: string
}

export default function MemoryDiaryPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Memory | null>(null)
  const [form, setForm] = useState({ title: '', description: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      const res = await memoriesApi.list()
      setMemories(res.data)
    } catch {
      toast.error('Не удалось загрузить воспоминания')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', description: '' })
    setImageFile(null)
    setImagePreview(null)
    setShowForm(true)
  }

  const openEdit = (m: Memory) => {
    setEditing(m)
    setForm({ title: m.title, description: m.description || '' })
    setImageFile(null)
    setImagePreview(m.image_path ? getAvatarUrl(m.image_path) : null)
    setShowForm(true)
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Введите название'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title.trim())
      fd.append('description', form.description.trim())
      if (imageFile) fd.append('image', imageFile)

      if (editing) {
        await memoriesApi.update(editing.id, fd)
        toast.success('Воспоминание обновлено')
      } else {
        await memoriesApi.create(fd)
        toast.success('Воспоминание добавлено')
      }
      setShowForm(false)
      await load()
    } catch {
      toast.error('Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить воспоминание?')) return
    try {
      await memoriesApi.delete(id)
      setMemories(prev => prev.filter(m => m.id !== id))
      toast.success('Удалено')
    } catch {
      toast.error('Ошибка при удалении')
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📖 Дневник воспоминаний</h1>
          <p className="text-sm text-gray-400 mt-0.5">Ваши близкие, места и события</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition"
        >
          <span className="text-lg leading-none">+</span> Добавить
        </button>
      </div>

      {/* Форма создания/редактирования */}
      {showForm && (
        <div className="bg-white border border-blue-100 rounded-2xl p-5 mb-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">{editing ? 'Редактировать' : 'Новое воспоминание'}</h2>

          {/* Фото */}
          <div
            onClick={() => fileRef.current?.click()}
            className="relative w-full h-44 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 cursor-pointer hover:border-blue-400 transition overflow-hidden flex items-center justify-center"
          >
            {imagePreview ? (
              <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
            ) : (
              <div className="text-center text-gray-400">
                <div className="text-3xl mb-1">📷</div>
                <p className="text-sm">Нажмите чтобы добавить фото</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>

          {/* Название */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Название *</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Например: Мама, Дача в Алматы, Свадьба..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Описание</label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              rows={3}
              placeholder="Расскажите об этом человеке или событии..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold disabled:opacity-60 transition"
            >
              {saving ? 'Сохраняю...' : 'Сохранить'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список */}
      {loading ? (
        <div className="text-center text-gray-400 py-16 text-sm">Загрузка...</div>
      ) : memories.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">🧠</div>
          <p className="text-gray-400 text-sm">Пока нет воспоминаний.<br />Добавьте первое!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {memories.map(m => (
            <div key={m.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
              {m.image_path ? (
                <img src={getAvatarUrl(m.image_path)!} className="w-full h-40 object-cover" alt={m.title} />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center text-5xl">
                  🧡
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{m.title}</h3>
                {m.description && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{m.description}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEdit(m)}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
