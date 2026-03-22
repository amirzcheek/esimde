import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { testsApi, authApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import type { Test } from '@/types'

export default function ReportPage() {
  const { hash } = useParams<{ hash: string }>()
  const navigate = useNavigate()
  const { token, user, setToken, setUser } = useAuthStore()
  const [report, setReport] = useState<Test | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    if (!hash) return
    testsApi.get(hash)
      .then(r => setReport(r.data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false))
  }, [hash])

  const sendCode = async () => {
    setError(''); setAuthLoading(true)
    try {
      const r = await authApi.sendOtp({ email })
      setStatus(`Код отправлен на ${email}`)
      if (r.data.dev_code) setDevCode(r.data.dev_code)
      setStep('code')
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Ошибка при отправке кода')
    } finally { setAuthLoading(false) }
  }

  const verifyCode = async () => {
    setError(''); setAuthLoading(true)
    try {
      const r = await authApi.verifyOtp({ email, code })
      setToken(r.data.access_token)
      if (r.data.user) setUser(r.data.user as any)
      setStatus('Вы успешно вошли')
    } catch {
      setError('Неверный или просроченный код')
    } finally { setAuthLoading(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (!report) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Отчёт не найден</p>
        <Link to="/" className="text-cyan-500 hover:underline">На главную</Link>
      </div>
    </div>
  )

  const score  = report.neurocognitive_score ?? 0
  const points = report.points ?? 0
  const hue    = score * 1.2
  const btnStyle = { background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }

  return (
    <div className="bg-gray-50 min-h-screen">
      <section className="container max-w-3xl mx-auto py-6 px-4">
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-lg border border-gray-200">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 text-center">Ваш результат</h1>

          {/* Score */}
          <div className="w-full flex flex-col items-center my-6">
            <div className="leading-none font-bold" style={{ fontSize: '8rem', color: `hsl(${hue},80%,45%)` }}>
              {score}<span className="text-6xl">%</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-gray-600">Уровень когнитивного здоровья</p>
          </div>

          {/* Статус */}
          {score >= 90 ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-5 text-green-700">
              <span className="font-semibold">Поздравляем!</span> Ваше когнитивное здоровье в норме.
            </div>
          ) : score >= 65 ? (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mb-5 text-yellow-700">
              Когнитивные функции <b>немного ниже нормы</b>. Рекомендуем обратить внимание.
            </div>
          ) : (
            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 mb-5 text-red-700">
              Обнаружены признаки <b>когнитивного снижения</b>. Рекомендуем проконсультироваться со специалистом.
            </div>
          )}

          {/* Текст и кнопка */}
          <div className="text-gray-700 text-sm leading-relaxed mb-6">
            {score >= 90
              ? 'Рекомендуем пройти профилактическое наблюдение у врача, чтобы убедиться в вашем здоровье и получить персональные рекомендации по его сохранению.'
              : score >= 65
              ? 'Рекомендуем обратиться к специалисту для получения более точных данных и выявления возможных факторов риска когнитивного снижения.'
              : 'Это важная информация. Для точного определения нарушений рекомендуется проконсультироваться со специалистом как можно скорее.'
            }
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={() => navigate('/test/go')}
              className="px-6 py-2.5 text-white font-semibold rounded-full hover:opacity-90 transition"
              style={btnStyle}
            >
              Пройти тест заново
            </button>
          </div>

          {/* Auth / действия */}
          <div className="w-full p-5 border border-gray-200 rounded-xl bg-gray-50">
            {!token ? (
              <>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Войдите, чтобы сохранить результат и записаться к врачу
                </h3>
                {devCode && (
                  <div className="text-sm bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-3 text-yellow-800">
                    DEV: код <strong>{devCode}</strong>
                  </div>
                )}
                {status && <div className="text-sm text-green-600 mb-2">{status}</div>}
                {step === 'email' ? (
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="flex-1 bg-white rounded-full outline-none ring-2 ring-transparent focus:ring-cyan-300 px-4 py-2 text-sm border border-gray-200"
                      placeholder="example@mail.com"
                    />
                    <button
                      onClick={sendCode}
                      disabled={authLoading}
                      className="px-4 py-2 text-white text-sm rounded-full hover:opacity-90 transition disabled:opacity-60"
                      style={btnStyle}
                    >
                      {authLoading ? '...' : 'Получить код'}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      className="flex-1 bg-white rounded-full outline-none ring-2 ring-transparent focus:ring-cyan-300 px-4 py-2 text-sm border border-gray-200"
                      placeholder="Код из письма"
                      maxLength={6}
                    />
                    <button
                      onClick={verifyCode}
                      disabled={authLoading}
                      className="px-4 py-2 text-white text-sm rounded-full hover:opacity-90 transition disabled:opacity-60"
                      style={btnStyle}
                    >
                      {authLoading ? '...' : 'Войти'}
                    </button>
                  </div>
                )}
                {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              </>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-700">
                    Вы вошли как <span className="font-medium">{user?.email}</span>
                  </div>
                  <p className="text-sm text-gray-500">Результат сохранён в личном кабинете.</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to="/appointment"
                    className="inline-flex items-center justify-center px-4 py-2 text-white text-sm font-semibold rounded-full hover:opacity-90 transition"
                    style={btnStyle}
                  >
                    Записаться к врачу
                  </Link>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-full hover:bg-gray-300 transition"
                  >
                    Кабинет
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
