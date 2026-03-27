export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">О компании</h1>

      <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-4 text-sm text-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Полное наименование</p>
            <p className="font-medium text-gray-900">ТОО «Galamat Integra»</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">БИН</p>
            <p className="font-medium text-gray-900">120840001932</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Страна регистрации</p>
            <p className="font-medium text-gray-900">Республика Казахстан</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Юридический адрес</p>
            <p className="font-medium text-gray-900">г. Астана, пр. Мангилик Ел 20/2, БЦ Азамат, 4 этаж</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Email</p>
            <p className="font-medium text-gray-900">
              <a href="mailto:info@galamat.com" className="text-cyan-600 hover:underline">info@galamat.com</a>
              {' / '}
              <a href="mailto:esimde@galamat.com" className="text-cyan-600 hover:underline">esimde@galamat.com</a>
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Телефон</p>
            <p className="font-medium text-gray-900">
              <a href="tel:+77718347530" className="text-cyan-600 hover:underline">+7 771 834 75 30</a>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6 text-sm text-gray-600">
        <p className="font-semibold text-gray-800 mb-2">О проекте esimde</p>
        <p>esimde — это онлайн-платформа для когнитивного скрининга и записи к специалистам. Мы помогаем пациентам своевременно выявить нарушения памяти и внимания и получить квалифицированную медицинскую помощь.</p>
      </div>
    </div>
  )
}
