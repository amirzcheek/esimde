import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { patientsApi, conclusionsApi, getAvatarUrl } from '@/api'
import { formatDate, formatTime, formatPhone, STATUS_BADGE, STATUS_LABELS, getScoreColor, getScoreLabel } from '@/lib/utils'
import type { PatientDetail } from '@/types'
import { FileText, ChevronDown, ChevronUp, Edit2, Check, X, Download } from 'lucide-react'
import { toast } from 'sonner'

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
        {patient.preliminary_conclusion && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-medium text-gray-500 mb-1">Предварительное заключение (ИИ)</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{patient.preliminary_conclusion}</p>
          </div>
        )}
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
                        <div className="space-y-2">
                          {[['complaints','Жалобы'],['diagnosis','Диагноз'],['medications','Назначения'],['diet_recommendations','Диета'],['examination_recommendations','Обследования']].map(([field,label]) => (
                            <div key={field}>
                              <label className="text-xs font-medium text-gray-600">{label}</label>
                              <textarea className="input mt-1 resize-none" rows={2}
                                value={conclusionForm[field] || ''} onChange={e => setConclusionForm(f => ({...f,[field]:e.target.value}))} />
                            </div>
                          ))}
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => conclusionMutation.mutate({cid:c.id,data:conclusionForm})}
                              disabled={conclusionMutation.isPending} className="btn-primary text-xs gap-1">
                              <Check size={12}/> Сохранить
                            </button>
                            <button onClick={() => setEditingConclusion(null)} className="btn-secondary text-xs gap-1">
                              <X size={12}/> Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {[['Жалобы',c.complaints],['Диагноз',c.diagnosis],['Назначения',c.medications],['Диета',c.diet_recommendations],['Обследования',c.examination_recommendations]].map(([lbl,val]) => val ? (
                              <div key={lbl}><p className="text-xs text-gray-500">{lbl}</p><p className="text-gray-800">{val}</p></div>
                            ) : null)}
                          </div>
                          <button onClick={() => startEditConclusion(c)} className="btn-ghost text-xs mt-2 gap-1">
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
