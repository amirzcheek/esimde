export default function RefundPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Возврат и отмена</h1>
      <p className="text-gray-500 mb-8 text-sm">Последнее обновление: март 2026 г.</p>

      <div className="space-y-6 text-sm text-gray-700">

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-3">Отмена записи пациентом</h2>
          <p className="mb-3">Вы можете отменить запись на приём <strong>не позднее чем за 24 часа</strong> до назначенного времени. В этом случае оплата возвращается в полном объёме.</p>
          <p className="text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">⚠️ Если отмена произошла менее чем за 24 часа до приёма — средства не возвращаются.</p>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-4">Порядок возврата средств</h2>
          <ul className="space-y-2">
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Возврат осуществляется на ту же банковскую карту, с которой была произведена оплата</li>
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Срок зачисления — до <strong>10 рабочих дней</strong> с момента подтверждения отмены</li>
            <li className="flex gap-2"><span className="text-cyan-500">•</span> Точный срок зависит от банка-эмитента карты</li>
          </ul>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-3">Если приём отменил врач</h2>
          <p>В случае если специалист отменил или перенёс приём по своей инициативе, возврат средств производится <strong>автоматически в полном объёме</strong> в течение 10 рабочих дней. Дополнительных действий с вашей стороны не требуется — уведомление об отмене и возврате придёт на ваш email.</p>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-base mb-3">Как инициировать возврат</h2>
          <p className="mb-3">Для отмены записи и возврата средств обратитесь в службу поддержки:</p>
          <div className="space-y-1">
            <p><a href="mailto:esimde@galamat.com" className="text-cyan-600 hover:underline font-medium">esimde@galamat.com</a></p>
            <p><a href="tel:+77718347530" className="text-cyan-600 hover:underline font-medium">+7 771 834 75 30</a></p>
          </div>
          <p className="mt-3 text-gray-500">В обращении укажите: имя, дату записи, имя специалиста и причину отмены. Мы обработаем запрос в течение 1–3 рабочих дней.</p>
        </section>

      </div>
    </div>
  )
}
