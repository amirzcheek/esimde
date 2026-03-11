import { Link } from 'react-router-dom'

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd"/>
  </svg>
)

// Кнопка «outline» — белый bg, градиентная рамка и текст, иконка Play
function BtnOutline({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="group inline-flex rounded-full transition-all duration-300 hover:shadow-lg"
      style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)', padding: '2px' }}
    >
      <div className="bg-white flex items-center gap-3 rounded-full pl-4 pr-2 py-2">
        <span
          className="font-semibold text-xl"
          style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          {children}
        </span>
        <div
          className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 text-white"
          style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }}
        >
          <PlayIcon />
        </div>
      </div>
    </Link>
  )
}

// Кнопка «solid» — градиентный фон, белый текст, белая иконка Play
function BtnSolid({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-3 rounded-full pl-4 pr-2 py-2 transition-all duration-300 hover:shadow-lg"
      style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }}
    >
      <span className="font-semibold text-xl text-white">{children}</span>
      <div className="bg-white w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 text-blue-400">
        <PlayIcon />
      </div>
    </Link>
  )
}

export default function LandingPage() {
  return (
    <div>
      {/* HERO */}
      <section className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-16">

          {/* Текст */}
          <div className="flex flex-col items-start md:w-[57%]">
            <h1 className="font-extrabold text-gray-700 text-4xl md:text-5xl mb-3 leading-tight">
              Ранняя диагностика{' '}
              <span
                className="block"
                style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                Альцгеймера и деменции
              </span>
            </h1>
            <p className="text-gray-500 text-left leading-relaxed mb-6">
              Данный тест, разработанный профессионалами, позволит помочь выявить болезнь
              Альцгеймера на ранних этапах развития, что может стать ключевым фактором в
              своевременной и эффективной борьбе с этим недугом с применением современных
              достижений медицины.
            </p>
            {/* Кнопка на десктопе */}
            <div className="hidden md:block">
              <BtnOutline to="/test">Пройти тест</BtnOutline>
            </div>
          </div>

          {/* Фото */}
          <div className="md:w-[43%] relative">
            <svg className="w-full" viewBox="0 0 400 330" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <clipPath id="blob1">
                  <path d="M400 30C400 13.4314 386.569 0 370 0H30C13.4315 0 0 13.4315 0 30V254.637C0 271.206 13.4315 284.637 30 284.637H51.6129H209.429H231.413C243.94 284.637 254.094 294.792 254.094 307.319C254.094 319.845 264.249 330 276.776 330H370C386.569 330 400 316.569 400 300V30Z"/>
                </clipPath>
              </defs>
              <image href="/images/home.png" width="400" height="330" preserveAspectRatio="xMidYMid slice" clipPath="url(#blob1)"/>
            </svg>
            <div className="flex items-center space-x-4 absolute bottom-0 left-0 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-tr-2xl rounded-bl-3xl">
              <div className="font-light text-gray-500 text-sm">7 вопросов</div>
              <div className="flex items-center font-light text-gray-500 gap-1.5 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                ≈ 6-7 минут
              </div>
            </div>
          </div>

          {/* Кнопка на мобиле — после фото */}
          <div className="md:hidden">
            <BtnOutline to="/test">Пройти тест</BtnOutline>
          </div>

        </div>
      </section>

      {/* 3 BLOCKS */}
      <section className="flex flex-col items-center container max-w-7xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-16 mb-12 w-full">
          {[
            { label: 'Пройдите короткий тест',                       img: '/images/block_1.jpg' },
            { label: 'Запишитесь на консультацию',                   img: '/images/block_2.jpg' },
            { label: 'Получите качественную диагностику и лечение',  img: '/images/block_3.jpg' },
          ].map(({ label, img }) => (
            <div
              key={label}
              className="rounded-4xl shadow-2xl overflow-hidden relative"
              style={{ aspectRatio: '3/4' }}
            >
              <img src={img} alt={label} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <h2 className="w-full font-bold text-2xl text-white text-center absolute bottom-0 p-6 leading-tight"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {label}
              </h2>
            </div>
          ))}
        </div>
        <BtnSolid to="/test">Пройти тест</BtnSolid>
      </section>

      {/* VIDEO */}
      <section className="w-full py-10 lg:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="relative w-full rounded-3xl overflow-hidden bg-gray-900 shadow-2xl" style={{aspectRatio:'16/9'}}>
            <video
              className="w-full h-full object-cover"
              controls
              preload="metadata"
              poster="/videos/poster.jpg"
            >
              <source src="/videos/video.mp4" type="video/mp4" />
              Ваш браузер не поддерживает видео.
            </video>
          </div>
        </div>
      </section>
    </div>
  )
}
