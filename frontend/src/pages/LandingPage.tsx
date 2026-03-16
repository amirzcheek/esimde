import { useEffect, useRef, useState } from 'react'
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

function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toggle = () => {
    if (!videoRef.current) return
    if (playing) { videoRef.current.pause(); setPlaying(false) }
    else { videoRef.current.play(); setPlaying(true) }
  }

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v) return
    setProgress(v.currentTime)
    setDuration(v.duration || 0)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Number(e.target.value)
    setProgress(Number(e.target.value))
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (!v) return
    const val = Number(e.target.value)
    v.muted = false
    v.volume = val
    setVolume(val)
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // Автозапуск когда видео появляется в viewport
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !playing) {
          v.muted = true
          setVolume(0)
          v.play().then(() => setPlaying(true)).catch(() => {})
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(v)
    return () => observer.disconnect()
  }, [])

  const onMouseMove = () => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), 2500)
  }

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-2xl bg-gray-900"
      style={{ aspectRatio: '16/9' }}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover cursor-pointer"
        preload="metadata"
        onEnded={() => setPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onClick={toggle}
      >
        <source src="/videos/video.mp4" type="video/mp4" />
      </video>

      {/* Оверлей play (только когда не играет) */}
      {!playing && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
          style={{ background: 'linear-gradient(to bottom, rgba(15,23,42,0.2), rgba(15,23,42,0.65))' }}
          onClick={toggle}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-200 hover:scale-110"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
          >
            <svg className="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.14v14l11-7-11-7z"/>
            </svg>
          </div>
          <span className="mt-4 text-white font-semibold text-sm tracking-wide drop-shadow">Смотреть видео</span>
        </div>
      )}

      {/* Контролы снизу */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8 transition-opacity duration-300 ${playing && !showControls ? 'opacity-0' : 'opacity-100'}`}
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Прогресс */}
        <input
          type="range" min={0} max={duration || 100} step={0.1}
          value={progress}
          onChange={handleSeek}
          className="w-full h-1 mb-3 cursor-pointer accent-cyan-400"
          style={{ accentColor: '#06b6d4' }}
        />

        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button onClick={toggle} className="text-white hover:text-cyan-400 transition flex-shrink-0">
            {playing ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.14v14l11-7-11-7z"/>
              </svg>
            )}
          </button>

          {/* Время */}
          <span className="text-white text-xs font-mono flex-shrink-0">
            {fmt(progress)} / {fmt(duration)}
          </span>

          <div className="flex-1" />

          {/* Громкость */}
          <svg className="w-4 h-4 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            {volume === 0
              ? <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18l2 2L21 18.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              : <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>
            }
          </svg>
          <input
            type="range" min={0} max={1} step={0.05}
            value={volume}
            onChange={handleVolume}
            className="w-20 h-1 cursor-pointer"
            style={{ accentColor: '#06b6d4' }}
          />
        </div>
      </div>
    </div>
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
          <VideoPlayer />
        </div>
      </section>
    </div>
  )
}
