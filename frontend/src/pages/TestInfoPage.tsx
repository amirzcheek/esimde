import { Link } from 'react-router-dom'

const STEPS = [
  'Не используйте календарь, калькулятор и справочный материал.',
  'Отключите функцию автозаполнения (Т9), в конце слов не должно быть пробелов.',
  'Нажмите <b>«Далее»</b>, чтобы перейти к следующему пункту.',
  'Нажмите <b>«Пройти тест заново»</b>, если желаете сбросить текущие результаты или пройти тест ещё раз.',
]

export default function TestInfoPage() {
  return (
    <section className="container max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col items-start">
        <h1 className="font-bold text-4xl text-gray-800 mb-8">Проверь себя</h1>
        <h2 className="font-medium text-3xl text-gray-800 mb-6">Порядок выполнения теста</h2>

        <div className="flex flex-col space-y-6 mb-8 pl-4">
          {STEPS.map((text, i) => (
            <div key={i} className="flex flex-row items-center">
              <div
                className="flex items-center justify-center flex-none w-10 h-10 font-medium text-2xl rounded-full mr-4"
                style={{ color: '#60a5fa', border: '2px solid #60a5fa' }}
              >
                {i + 1}
              </div>
              <p className="text-gray-800 text-lg" dangerouslySetInnerHTML={{ __html: text }} />
            </div>
          ))}
        </div>

        <Link
          to="/test/go"
          className="group flex-none inline-flex items-center rounded-full cursor-pointer overflow-hidden relative transition-all duration-300 p-0.5"
          style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }}
        >
          <div className="bg-transparent flex items-center space-x-4 w-full rounded-full px-4 py-2">
            <span className="font-semibold text-white transition-all duration-300">Начать тестирование</span>
          </div>
        </Link>
      </div>
    </section>
  )
}
