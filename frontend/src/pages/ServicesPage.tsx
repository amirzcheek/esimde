import { Link } from 'react-router-dom'

export default function ServicesPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Услуги и цены</h1>
      <p className="text-gray-500 mb-8 text-sm">Прозрачные условия без скрытых комиссий</p>

      <div className="space-y-6">
        {/* Бесплатный тест */}
        <div className="bg-white border border-green-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold mb-3">
                🧠 Бесплатно
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Когнитивный скрининг</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Короткий онлайн-тест для оценки когнитивных функций — памяти, внимания и мышления. Занимает около 5–7 минут. Доступен без регистрации.
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-2xl font-bold text-green-600">0 ₸</p>
              <p className="text-xs text-gray-400">бесплатно</p>
            </div>
          </div>
          <Link to="/test" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition">
            Пройти тест →
          </Link>
        </div>

        {/* Консультация */}
        <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3">
                👨‍⚕️ Платная услуга
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Консультация специалиста</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                По результатам теста вы можете записаться на приём к специалисту. Врач изучит результаты скрининга, проведёт консультацию и при необходимости даст рекомендации по дальнейшему обследованию.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Продолжительность: 60 минут</li>
                <li>• Формат: очно / онлайн</li>
                <li>• Оплата: банковской картой Visa или Mastercard</li>
              </ul>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-2xl font-bold text-blue-600">15 000 –</p>
              <p className="text-2xl font-bold text-blue-600">30 000 ₸</p>
              <p className="text-xs text-gray-400">в зависимости от врача</p>
            </div>
          </div>
          <Link to="/appointment" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold hover:opacity-90 transition">
            Записаться →
          </Link>
        </div>

        {/* Важно */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-800">
          <p className="font-semibold mb-1">⚠️ Важно</p>
          <p>Стоимость приёма при оплате картой соответствует стоимости при других способах оплаты — без дополнительных комиссий для покупателя.</p>
        </div>
      </div>
    </div>
  )
}
