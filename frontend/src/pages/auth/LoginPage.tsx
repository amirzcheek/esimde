import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import AuthLayout from '@/components/layout/AuthLayout'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setToken, setUser } = useAuthStore()
  const [mode, setMode] = useState<'patient' | 'doctor'>('patient')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [devCode, setDevCode] = useState('')
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'doctor') {
        const r = await authApi.doctorLogin({ username, password })
        setToken(r.data.access_token)
        if (r.data.user) setUser(r.data.user as any)
        if (r.data.is_admin) navigate('/admin/audit')
        else navigate('/doctor')
      } else if (step === 'email') {
        const r = await authApi.sendOtp({ email })
        setStatusMsg(`Код отправлен на ${email}`)
        if (r.data.dev_code) setDevCode(r.data.dev_code)
        setStep('code')
      } else {
        const r = await authApi.verifyOtp({ email, code })
        setToken(r.data.access_token)
        if (r.data.user) setUser(r.data.user as any)
        navigate(r.data.is_doctor ? '/doctor' : '/dashboard')
      }
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      const msg = typeof detail === 'string' ? detail : e?.response?.data?.message
      setError(msg || 'Ошибка. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  const gradStyle = { background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }
  const modeBtnCls = (active: boolean) =>
    `px-4 py-1.5 rounded-full text-sm border transition-all ${active ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-300'}`

  return (
    <AuthLayout>
      <div className="w-full max-w-sm flex flex-col gap-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Авторизация</h1>

        {statusMsg && (
          <div className="text-sm text-center text-green-600 bg-green-50 rounded-xl p-2">{statusMsg}</div>
        )}
        {devCode && (
          <div className="text-sm text-center bg-yellow-50 border border-yellow-200 rounded-xl p-2 text-yellow-800">
            DEV: код <strong>{devCode}</strong>
          </div>
        )}

        {/* Переключатель */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setMode('patient'); setStep('email'); setError('') }}
            className={modeBtnCls(mode === 'patient')} style={mode === 'patient' ? gradStyle : {}}>
            Пациент
          </button>
          <button type="button" onClick={() => { setMode('doctor'); setError('') }}
            className={modeBtnCls(mode === 'doctor')} style={mode === 'doctor' ? gradStyle : {}}>
            Врач
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {mode === 'patient' ? (
            <>
              <div className="flex flex-col">
                <label className="font-medium text-sm mb-2">E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-esimde" placeholder="example@mail.com"
                  disabled={step === 'code'} autoComplete="email" required />
              </div>
              {step === 'code' && (
                <div className="flex flex-col">
                  <label className="font-medium text-sm mb-2">Код из письма</label>
                  <input type="text" value={code} onChange={e => setCode(e.target.value)}
                    className="input-esimde" placeholder="XXXX"
                    autoComplete="one-time-code" maxLength={6} required />
                  <button type="button" className="text-xs text-cyan-500 mt-2 text-left hover:underline"
                    onClick={() => { setStep('email'); setCode(''); setDevCode(''); setStatusMsg(''); setError('') }}>
                    ← Изменить email
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col">
                <label className="font-medium text-sm mb-2">Логин врача</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="input-esimde" placeholder="doctor" autoComplete="username" required />
              </div>
              <div className="flex flex-col">
                <label className="font-medium text-sm mb-2">Пароль</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="input-esimde" placeholder="••••••••" autoComplete="current-password" required />
              </div>
            </>
          )}

          {error && (
            <div className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="inline-flex items-center rounded-full p-0.5 transition-all hover:shadow-lg disabled:opacity-60"
            style={gradStyle}>
            <div className="bg-transparent flex items-center rounded-full px-5 py-2.5">
              <span className="font-semibold text-white">
                {loading ? 'Загрузка...' : (step === 'email' && mode === 'patient') ? 'Получить код' : 'Войти'}
              </span>
            </div>
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
