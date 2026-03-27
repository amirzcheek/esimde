import { Link } from 'react-router-dom'

export default function LandingFooter() {
  return (
    <footer className="w-full bg-blue-50 pt-10 pb-6" id="contacts">
      <div className="container max-w-7xl mx-auto px-4">

        <div className="flex items-start flex-wrap gap-8 mb-8">
          {/* Logo */}
          <div className="flex flex-col gap-3">
            <a href="/" className="font-bold text-3xl" style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              esimde
            </a>
            <p className="text-xs text-gray-400 max-w-[180px]">Платформа когнитивного здоровья</p>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col ml-0 md:ml-14">
            <h3 className="font-semibold text-gray-800 mb-2">Подпишитесь на обновления</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input className="w-full sm:min-w-[220px] bg-white text-sm border border-gray-200 rounded-full px-4 py-2 outline-none focus:border-cyan-400" type="text" placeholder="Электронная почта" />
              <button className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition whitespace-nowrap" style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }}>
                Подписаться
              </button>
            </div>
          </div>

          {/* Contacts + Address */}
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-8 ml-0 md:ml-auto">
            <div className="flex flex-col">
              <h3 className="font-semibold text-gray-800 mb-2">Контакты</h3>
              <div className="font-semibold mb-2">Galamat Group</div>
              <div className="flex items-center mb-2 gap-2">
                <svg className="text-blue-400 w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z"/><path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z"/></svg>
                <a href="https://galamat.com" target="_blank" rel="noreferrer" className="text-gray-800 hover:text-blue-500 border-b border-dashed text-sm">galamat.com</a>
              </div>
              <div className="flex items-center mb-2 gap-2">
                <svg className="text-blue-400 w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z"/><path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z"/></svg>
                <a href="mailto:esimde@galamat.com" className="text-gray-800 hover:text-blue-500 border-b border-dashed text-sm">esimde@galamat.com</a>
              </div>
              <div className="flex items-center gap-2">
                <svg className="text-blue-400 w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd"/></svg>
                <a href="tel:+77718347530" className="text-gray-800 hover:text-blue-500 border-b border-dashed text-sm">+7 771 834 75 30</a>
              </div>
            </div>
            <div className="flex flex-col">
              <h3 className="font-semibold text-gray-800 mb-2">Адрес</h3>
              <div className="flex items-start gap-2 text-sm">
                <svg className="text-blue-400 w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd"/></svg>
                Мангілік Ел 20/2, 4 этаж
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-blue-100 pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Ссылки */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
              <Link to="/about" className="hover:text-cyan-600 transition">О компании</Link>
              <Link to="/services" className="hover:text-cyan-600 transition">Услуги и цены</Link>
              <Link to="/payment" className="hover:text-cyan-600 transition">Условия оплаты</Link>
              <Link to="/refund" className="hover:text-cyan-600 transition">Возврат и отмена</Link>
              <Link to="/privacy" className="hover:text-cyan-600 transition">Политика конфиденциальности</Link>
            </div>
            {/* Логотипы */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-1 flex items-center h-8">
                <span className="text-[#00579f] font-bold text-sm italic">VISA</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-2 py-1 flex items-center gap-1 h-8">
                <span className="w-5 h-5 rounded-full bg-[#eb001b] inline-block -mr-2 opacity-90"></span>
                <span className="w-5 h-5 rounded-full bg-[#f79e1b] inline-block opacity-90"></span>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-2 py-1 flex items-center gap-1 h-8">
                <span className="text-green-600 text-xs">🔒</span>
                <span className="text-xs font-bold text-gray-600">3D Secure</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs text-gray-400">
            <p>© {new Date().getFullYear()} ТОО «Galamat Integra». БИН 120840001932. Все права защищены.</p>
            <p className="text-amber-600 font-medium">💾 Сохраняйте копии документов об оплате (чеки, квитанции)</p>
          </div>
        </div>

      </div>
    </footer>
  )
}
