import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { patientsApi, conclusionsApi, getAvatarUrl } from '@/api'
import { formatDate, formatTime, formatPhone, STATUS_BADGE, STATUS_LABELS, getScoreColor, getScoreLabel } from '@/lib/utils'
import type { PatientDetail } from '@/types'
import { FileText, ChevronDown, ChevronUp, Edit2, Check, X, Download } from 'lucide-react'
import { toast } from 'sonner'


// ─── Редактор предварительного заключения ────────────────────────────────────
function PreliminaryEditor({ patientId, initial }: { patientId: number; initial: string }) {
  const [editing, setEditing] = useState(false)
  const [text, setText]       = useState(initial)
  const [saving, setSaving]   = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await patientsApi.updatePreliminary(patientId, text)
      toast.success('Заключение сохранено')
      setEditing(false)
    } catch {
      toast.error('Ошибка сохранения')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500">Предварительное заключение</p>
        {!editing && (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-600 transition">
            <Edit2 size={12}/> {text ? 'Редактировать' : 'Добавить'}
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={text} onChange={e => setText(e.target.value)}
            rows={4} placeholder="Введите предварительное заключение..."
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 text-sm outline-none focus:border-cyan-400 focus:bg-white transition resize-none"
          />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold transition hover:opacity-90 disabled:opacity-50"
              style={{background:'linear-gradient(135deg,#06b6d4,#3b82f6)'}}>
              <Check size={12}/> {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button onClick={() => { setEditing(false); setText(initial) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition">
              <X size={12}/> Отмена
            </button>
          </div>
        </div>
      ) : text ? (
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{text}</p>
      ) : (
        <p className="text-sm text-gray-400 italic">Не заполнено</p>
      )}
    </div>
  )
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [editingConclusion, setEditingConclusion] = useState<number | null>(null)
  const [conclusionForm, setConclusionForm] = useState<Record<string, string>>({})
  const [expandedAppt, setExpandedAppt] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsApi.get(Number(id)).then(r => r.data as PatientDetail),
  })

  const conclusionMutation = useMutation({
    mutationFn: ({ cid, data }: { cid: number; data: Record<string, string> }) =>
      conclusionsApi.update(cid, data),
    onSuccess: () => { toast.success('Заключение сохранено'); qc.invalidateQueries({ queryKey: ['patient', id] }); setEditingConclusion(null) },
    onError: () => toast.error('Ошибка сохранения'),
  })

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Загрузка…</div>
  if (!data) return null

  const { patient, appointments, conclusions, analyses, last_test } = data

  const startEditConclusion = (c: typeof conclusions[0]) => {
    setEditingConclusion(c.id)
    setConclusionForm({ complaints: c.complaints||'', diagnosis: c.diagnosis||'', medications: c.medications||'', diet_recommendations: c.diet_recommendations||'', examination_recommendations: c.examination_recommendations||'' })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 text-2xl font-bold flex-shrink-0">
          {patient.full_name.split(' ').slice(0,2).map(s=>s[0]).join('')}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{patient.full_name}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
            {patient.age && <span>{patient.age} лет</span>}
            {patient.phone && <span>{formatPhone(patient.phone)}</span>}
            {patient.birth_date && <span>{formatDate(patient.birth_date)}</span>}
          </div>
          {last_test && (
            <div className="mt-3 flex items-center gap-3">
              <div className="w-32 h-2 rounded-full overflow-hidden score-track">
                <div className="score-needle" style={{ left: `${last_test.score}%` }} />
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(last_test.score)}`}>{last_test.score.toFixed(0)}%</span>
              <span className="text-xs text-gray-500">{getScoreLabel(last_test.score)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Medical info */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Медицинская информация</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Хронические заболевания', value: patient.chronic_diseases },
            { label: 'Аллергии на препараты', value: patient.medication_allergies },
            { label: 'История болезни', value: patient.medical_history },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{value || <span className="text-gray-300">—</span>}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t space-y-4">
          {/* Статус теста */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Результат нейрокогнитивного теста</p>
            {last_test ? (
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${getScoreColor(last_test.score)}`}>{last_test.score.toFixed(1)}%</span>
                <span className="text-xs text-gray-400">{getScoreLabel(last_test.score)}</span>
              </div>
            ) : (
              <p className="text-sm text-amber-600 font-medium">⚠ Тест не пройден</p>
            )}
          </div>
          {/* Предварительное заключение */}
          <PreliminaryEditor patientId={patient.id} initial={patient.preliminary_conclusion || ''} />
        </div>
      </div>

      {/* Appointments */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Приёмы ({appointments.length})</h2>
        <div className="space-y-2">
          {appointments.map(a => (
            <div key={a.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedAppt(expandedAppt === a.id ? null : a.id)}>
                <span className="font-mono text-sm text-gray-700">{formatDate(a.date)}</span>
                <span className="text-sm text-gray-500">{formatTime(a.start_time)}–{formatTime(a.end_time)}</span>
                <span className="text-xs text-gray-400">{a.type === 'online' ? '🌐' : '🏥'}</span>
                <span className={STATUS_BADGE[a.status]}>{STATUS_LABELS[a.status]}</span>
                <span className="ml-auto text-gray-400">{expandedAppt === a.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</span>
              </div>
              {expandedAppt === a.id && (
                <div className="border-t bg-gray-50 p-3">
                  {conclusions.filter(c => c.appointment_id === a.id).map(c => (
                    <div key={c.id}>
                      {editingConclusion === c.id ? (
                        <div className="space-y-3 p-4 bg-white rounded-2xl border border-gray-200">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Заключение приёма</p>
                          {[['complaints','🩺 Жалобы'],['diagnosis','📋 Диагноз'],['medications','💊 Назначения'],['diet_recommendations','🥗 Диета'],['examination_recommendations','🔬 Обследования']].map(([field,label]) => (
                            <div key={field}>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
                              <textarea
                                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 text-sm outline-none focus:border-cyan-400 focus:bg-white transition resize-none"
                                rows={2}
                                placeholder="Введите текст..."
                                value={conclusionForm[field] || ''} onChange={e => setConclusionForm(f => ({...f,[field]:e.target.value}))} />
                            </div>
                          ))}
                          <div className="flex gap-3 pt-1">
                            <button onClick={() => conclusionMutation.mutate({cid:c.id,data:conclusionForm})}
                              disabled={conclusionMutation.isPending}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                              style={{background:'linear-gradient(135deg,#06b6d4,#3b82f6)'}}>
                              <Check size={14}/> Сохранить
                            </button>
                            <button onClick={() => setEditingConclusion(null)}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">
                              <X size={14}/> Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-white rounded-2xl border border-gray-100">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[['🩺 Жалобы',c.complaints],['📋 Диагноз',c.diagnosis],['💊 Назначения',c.medications],['🥗 Диета',c.diet_recommendations],['🔬 Обследования',c.examination_recommendations]].map(([lbl,val]) => val ? (
                              <div key={lbl} className="bg-gray-50 rounded-xl p-3">
                                <p className="text-xs font-semibold text-gray-400 mb-1">{lbl}</p>
                                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{val}</p>
                              </div>
                            ) : null)}
                          </div>
                          <button onClick={() => startEditConclusion(c)}
                            className="flex items-center gap-2 mt-4 px-4 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 transition">
                            <Edit2 size={12}/> Редактировать заключение
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {conclusions.filter(c => c.appointment_id === a.id).length === 0 && (
                    <p className="text-xs text-gray-400">Заключение не заполнено</p>
                  )}
                </div>
              )}
            </div>
          ))}
          {appointments.length === 0 && <p className="text-gray-400 text-sm">Нет приёмов</p>}
        </div>
      </div>

      {/* Analyses */}
      {analyses.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Анализы ({analyses.length})</h2>
          <div className="space-y-2">
            {analyses.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <FileText size={16} className="text-cyan-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{a.file_name}</p>
                  {a.description && <p className="text-xs text-gray-500 truncate">{a.description}</p>}
                  <p className="text-xs text-gray-400">{formatDate(a.uploaded_at)}</p>
                </div>
                {a.file_path && (
                  <a
                    href={`/uploads/${a.file_path}`}
                    download={a.file_name}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition flex-shrink-0"
                    title="Скачать"
                  >
                    <Download size={16} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
