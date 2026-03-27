export default function PaymentPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Условия оплаты</h1>
      <p className="text-gray-500 mb-8 text-sm">Последнее обновление: март 2026 г.</p>

      <div className="space-y-6 text-sm text-gray-700">

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-3">Способы оплаты</h2>
          <p className="mb-3">На сайте esimde.kz оплата принимается банковскими картами <strong>Visa</strong> и <strong>Mastercard</strong> через защищённый платёжный сервис <strong>PayLink</strong>. Все транзакции обрабатываются на стороне PayLink — данные вашей карты не передаются и не хранятся на нашем сайте.</p>
          <div className="flex items-center gap-4 mt-4">
            <img src="/images/visa.svg" alt="Visa" className="h-8 opacity-80" onError={e => (e.currentTarget.style.display='none')} />
            <img src="/images/mastercard.svg" alt="Mastercard" className="h-8 opacity-80" onError={e => (e.currentTarget.style.display='none')} />
            <span className="text-xs font-semibold text-gray-500 border border-gray-200 rounded px-2 py-1">🔒 3D Secure</span>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-3">Валюта</h2>
          <p>Все платежи осуществляются в <strong>тенге (KZT)</strong>.</p>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-4">Как происходит оплата</h2>
          <ol className="space-y-2">
            {[
              'Выберите специалиста и удобное время приёма',
              'Нажмите кнопку «Записаться и оплатить»',
              'Ознакомьтесь с условиями и подтвердите согласие',
              'Вы будете перенаправлены на защищённую форму оплаты PayLink',
              'Введите данные банковской карты',
              'Подтвердите платёж через SMS-код (технология 3D Secure)',
              'После успешной оплаты вы получите подтверждение на экране и письмо на email с квитанцией',
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-3">Защита платежей</h2>
          <p>Все транзакции защищены технологией <strong>3D Secure</strong> — дополнительным уровнем подтверждения, при котором банк запрашивает одноразовый код для завершения оплаты. Это исключает несанкционированное использование данных карты.</p>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-3">Подтверждение оплаты</h2>
          <p>После успешного платежа на указанный вами email автоматически отправляется квитанция. Рекомендуем сохранять копии квитанций об оплате.</p>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-3">Цена</h2>
          <p>Стоимость приёма при оплате картой соответствует стоимости при других способах оплаты — <strong>без дополнительных комиссий</strong> для покупателя.</p>
        </section>

        <section className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <h2 className="font-bold text-amber-800 text-base mb-2">Вопросы по оплате</h2>
          <p className="text-amber-700">Если при оплате возникла ошибка или списание прошло, но запись не подтвердилась — обратитесь в службу поддержки:</p>
          <p className="mt-2"><a href="mailto:esimde@galamat.com" className="text-cyan-600 hover:underline font-medium">esimde@galamat.com</a></p>
        </section>

      </div>
    </div>
  )
}
