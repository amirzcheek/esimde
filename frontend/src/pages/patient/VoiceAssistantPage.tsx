import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { voiceApi } from '@/api'
import { toast } from 'sonner'
import { Mic, MicOff, Send, RotateCcw } from 'lucide-react'

const QUESTIONS = [
  'Расскажите о ваших текущих жалобах и симптомах',
  'Какие хронические заболевания у вас есть?',
  'Какие лекарства вы принимаете?',
]

export default function VoiceAssistantPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [current, setCurrent] = useState('')
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [structured, setStructured] = useState<any>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const gradStyle = { background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setLoading(true)
        try {
          const r = await voiceApi.transcribe(blob)
          setCurrent(r.data.text || '')
        } catch {
          toast.error('Ошибка распознавания речи')
        } finally {
          setLoading(false)
        }
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
    } catch {
      toast.error('Нет доступа к микрофону')
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    mediaRef.current = null
    setRecording(false)
  }

  const nextStep = () => {
    const newAnswers = [...answers, current]
    setAnswers(newAnswers)
    setCurrent('')

    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1)
    } else {
      // Все вопросы отвечены — структурируем
      handleStructure(newAnswers)
    }
  }

  const handleStructure = async (ans: string[]) => {
    setLoading(true)
    try {
      const r = await voiceApi.structure(ans)
      setStructured(r.data)
    } catch {
      toast.error('Ошибка обработки ответов')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!structured) return
    setSaving(true)
    try {
      await voiceApi.save(structured)
      toast.success('Данные сохранены в профиле')
      navigate('/dashboard')
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setStep(0)
    setAnswers([])
    setCurrent('')
    setStructured(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Голосовой ассистент</h1>
      <p className="text-sm text-gray-500 mb-6">
        Ответьте на несколько вопросов — мы составим предварительное заключение для врача
      </p>

      {!structured ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
          {/* Прогресс */}
          <div className="flex gap-2">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i < step ? 'bg-cyan-500' : i === step ? 'bg-cyan-300' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Вопрос */}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-cyan-600 font-medium mb-1">Вопрос {step + 1} из {QUESTIONS.length}</p>
            <p className="text-gray-800 font-medium">{QUESTIONS[step]}</p>
          </div>

          {/* Ответ */}
          <textarea
            value={current}
            onChange={e => setCurrent(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-none"
            placeholder="Введите ответ или используйте микрофон..."
          />

          {/* Кнопки */}
          <div className="flex gap-3">
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition ${
                recording
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {recording ? <><MicOff size={15} /> Стоп</> : <><Mic size={15} /> Запись</>}
            </button>

            <button
              onClick={nextStep}
              disabled={!current.trim() || loading || recording}
              className="flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-white text-sm font-semibold disabled:opacity-50 transition hover:opacity-90"
              style={gradStyle}
            >
              {loading ? 'Обработка...' : step + 1 < QUESTIONS.length ? 'Следующий вопрос' : (
                <><Send size={14} /> Завершить</>
              )}
            </button>
          </div>

          {/* Предыдущие ответы */}
          {answers.length > 0 && (
            <div className="border-t pt-4 space-y-2">
              {answers.map((a, i) => (
                <div key={i} className="text-xs text-gray-500">
                  <span className="font-medium text-gray-600">{QUESTIONS[i].slice(0, 30)}…</span>
                  <p className="mt-0.5 text-gray-700">{a}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Результат */
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Предварительное заключение</h2>

          {[
            ['Жалобы', structured.complaints],
            ['Хронические заболевания', structured.chronic_diseases],
            ['Принимаемые препараты', structured.medications],
            ['Заключение', structured.preliminary_conclusion],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label as string}>
              <p className="text-xs font-medium text-gray-500 mb-1">{label as string}</p>
              <p className="text-sm text-gray-800 bg-gray-50 rounded-xl px-4 py-3 whitespace-pre-wrap">{value as string}</p>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              <RotateCcw size={14} /> Заново
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-white text-sm font-semibold disabled:opacity-50 transition hover:opacity-90"
              style={gradStyle}
            >
              {saving ? 'Сохранение...' : 'Сохранить в профиль'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
