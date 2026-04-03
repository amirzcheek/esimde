import { Link, useSearchParams } from 'react-router-dom'

export function PaymentSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Оплата прошла успешно!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Ваша запись подтверждена. Квитанция отправлена на email.
          Сохраните её для подтверждения оплаты.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/dashboard"
            className="px-6 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition"
            style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }}
          >
            Перейти в личный кабинет
          </Link>
        </div>
      </div>
    </div>
  )
}

export function PaymentFailPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Оплата не прошла</h1>
        <p className="text-gray-500 text-sm mb-6">
          Платёж не был завершён. Запись не подтверждена.
          Попробуйте ещё раз или обратитесь в поддержку: <a href="mailto:esimde@galamat.com" className="text-cyan-600 hover:underline">esimde@galamat.com</a>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/appointment"
            className="px-6 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition"
            style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }}
          >
            Попробовать снова
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-2.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            В личный кабинет
          </Link>
        </div>
      </div>
    </div>
  )
}
