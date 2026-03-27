export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Политика конфиденциальности</h1>
      <p className="text-gray-500 mb-8 text-sm">Последнее обновление: март 2026 г.</p>

      <div className="space-y-6 text-sm text-gray-700">

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-3">1. Общие положения</h2>
          <p>Настоящая Политика конфиденциальности определяет порядок обработки персональных данных пользователей сайта esimde.kz, принадлежащего ТОО «Galamat Integra» (БИН 120840001932).</p>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-3">2. Какие данные мы собираем</h2>
          <ul className="space-y-1.5">
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Имя, фамилия, отчество</li>
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Номер телефона и адрес электронной почты</li>
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Дата рождения</li>
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Результаты когнитивного теста</li>
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Информация о записях на приём</li>
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Технические данные (IP-адрес, тип браузера, cookies)</li>
          </ul>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-3">3. Цели обработки данных</h2>
          <ul className="space-y-1.5">
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Предоставление доступа к сервису и персонализация</li>
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Организация записи к специалистам</li>
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Обработка платежей через PayLink</li>
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Отправка уведомлений о записях</li>
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Улучшение качества сервиса</li>
          </ul>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-3">4. Передача данных третьим лицам</h2>
          <p className="mb-2">Мы не продаём и не передаём ваши персональные данные третьим лицам, за исключением:</p>
          <ul className="space-y-1.5">
            <li className="flex gap-2"><span className="text-cyan-500">•</span> PayLink — для обработки платежей</li>
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Врачей платформы — в объёме, необходимом для оказания медицинской помощи</li>
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Государственных органов — по законному требованию</li>
          </ul>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-3">5. Хранение и защита данных</h2>
          <p>Данные хранятся на защищённых серверах. Мы применяем технические и организационные меры для защиты информации от несанкционированного доступа, изменения или уничтожения.</p>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-3">6. Права пользователя</h2>
          <p className="mb-2">Вы вправе:</p>
          <ul className="space-y-1.5">
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Запросить информацию о ваших персональных данных</li>
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Потребовать исправления или удаления данных</li>
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Отозвать согласие на обработку данных</li>
          </ul>
          <p className="mt-3">Для реализации прав обращайтесь: <a href="mailto:esimde@galamat.com" className="text-cyan-600 hover:underline">esimde@galamat.com</a></p>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-3">7. Контакты</h2>
          <p>ТОО «Galamat Integra», г. Астана, пр. Мангилик Ел 20/2</p>
          <p><a href="mailto:esimde@galamat.com" className="text-cyan-600 hover:underline">esimde@galamat.com</a></p>
        </section>

      </div>
    </div>
  )
}
