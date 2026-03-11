import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { testsApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import type { Test } from '@/types'

// ─── Типы ────────────────────────────────────────────────────────────────────
type QType = 'date'|'images'|'category'|'coins'|'change'|'instruction'|'connect'|'lines'|'letters'|'figures'|'final'
interface Question { id: number; type: QType }
const QUESTIONS: Question[] = [
  { id:1,type:'date' },    { id:2,type:'images' },  { id:3,type:'category' },
  { id:4,type:'coins' },   { id:5,type:'change' },  { id:6,type:'instruction' },
  { id:7,type:'connect' }, { id:8,type:'lines' },   { id:9,type:'letters' },
  { id:10,type:'figures'}, { id:11,type:'final' },
]
function rand<T>(a: T[]): T { return a[Math.floor(Math.random()*a.length)] }
function shuffle<T>(a: T[]): T[] { return [...a].sort(()=>Math.random()-.5) }

const GRAD = 'linear-gradient(135deg, #06b6d4, #3b82f6)'

// ─── Базовые компоненты ───────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
        {children}
      </div>
    </div>
  )
}

function QTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{title}</h2>
      {hint && <p className="text-gray-500 mt-1.5 text-sm">{hint}</p>}
    </div>
  )
}

function DInput({ value, onChange, placeholder, type = 'text', hasError, className = '' }: {
  value: string; onChange: (v: string) => void; placeholder?: string
  type?: string; hasError?: boolean; className?: string
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (type === 'number') {
      if (val === '' || /^\d*$/.test(val)) onChange(val)
    } else {
      onChange(val)
    }
  }
  return (
    <input
      type={type === 'number' ? 'text' : type}
      inputMode={type === 'number' ? 'numeric' : undefined}
      value={value} placeholder={placeholder}
      onChange={handleChange}
      className={`w-full px-4 py-3 rounded-2xl border-2 text-sm outline-none transition-all
        ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-cyan-400 focus:bg-white'}
        ${className}`}
    />
  )
}

function PrimaryBtn({ onClick, label = 'Далее →', disabled }: { onClick: () => void; label?: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className="mt-6 w-full sm:w-auto px-8 py-3.5 rounded-2xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
      style={{ background: GRAD }}
    >
      {label}
    </button>
  )
}

function ErrMsg({ msg }: { msg: string }) {
  return msg ? <p className="mt-2 text-red-500 text-xs">{msg}</p> : null
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-500 mb-1.5">{children}</p>
}

// ─── Q1: Дата ─────────────────────────────────────────────────────────────────
function Q1({ onAnswer }: { onAnswer: (p: number) => void }) {
  const [day, setDay]     = useState('')
  const [month, setMonth] = useState('0')
  const [year, setYear]   = useState('')
  const [err, setErr]     = useState('')
  const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

  const submit = () => {
    if (!day || month === '0' || !year) { setErr('Заполните все поля'); return }
    const now = new Date()
    const p = (parseInt(day)===now.getDate()?1:0) + (parseInt(month)===now.getMonth()+1?1:0) + (parseInt(year)===now.getFullYear()?1:0)
    onAnswer(p)
  }

  return (
    <Card>
      <QTitle title="Назовите сегодняшнюю дату" hint="По памяти, никуда не заглядывая" />
      <div className="grid grid-cols-3 gap-3">
        <div>
          <FieldLabel>День</FieldLabel>
          <DInput value={day} onChange={v => { const n = v.replace(/\D/g,''); if (n===''||( parseInt(n)>=1&&parseInt(n)<=31&&n.length<=2)) setDay(n) }} placeholder="01" type="number" hasError={!!err&&!day} />
        </div>
        <div>
          <FieldLabel>Месяц</FieldLabel>
          <select value={month} onChange={e => setMonth(e.target.value)}
            className={`w-full px-4 py-3 rounded-2xl border-2 text-sm outline-none bg-gray-50 transition-all
              ${err&&month==='0' ? 'border-red-400' : 'border-gray-200 focus:border-cyan-400'}`}>
            <option value="0" disabled>Месяц</option>
            {months.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>Год</FieldLabel>
          <DInput value={year} onChange={v => { const n = v.replace(/\D/g,'').slice(0,4); setYear(n) }} placeholder="2025" type="number" hasError={!!err&&!year} />
        </div>
      </div>
      <ErrMsg msg={err} />
      <PrimaryBtn onClick={submit} />
    </Card>
  )
}

// ─── Q2: Картинки — фото из /images/test/ ────────────────────────────────────
const ANIMALS = [
  { answer: 'Носорог', image: '/images/test/nosorog.jpg' },
  { answer: 'Слон',    image: '/images/test/slon.jpg'    },
  { answer: 'Сова',    image: '/images/test/sova.jpg'    },
  { answer: 'Зебра',   image: '/images/test/zebra.jpg'   },
  { answer: 'Жираф',   image: '/images/test/zhiraf.jpg'  },
]
const INSTRS = [
  { answer: 'Арфа',    image: '/images/test/arfa.jpg'    },
  { answer: 'Барабан', image: '/images/test/baraban.jpg' },
  { answer: 'Гитара',  image: '/images/test/gitara.jpg'  },
  { answer: 'Рояль',   image: '/images/test/royal.jpg'   },
  { answer: 'Скрипка', image: '/images/test/scripka.jpg' },
]

function Q2({ onAnswer }: { onAnswer: (p: number) => void }) {
  const [animal] = useState(() => rand(ANIMALS))
  const [instr]  = useState(() => rand(INSTRS))
  const [a1, setA1] = useState(''); const [a2, setA2] = useState('')
  const [err, setErr] = useState('')

  const submit = () => {
    if (!a1||!a2) { setErr('Введите оба названия'); return }
    onAnswer(
      (a1.trim().toLowerCase()===animal.answer.toLowerCase()?1:0)+
      (a2.trim().toLowerCase()===instr.answer.toLowerCase()?1:0)
    )
  }

  return (
    <Card>
      <QTitle title="Назовите объекты, изображённые на рисунках" hint="Запишите названия изображений" />
      <div className="grid grid-cols-2 gap-6">
        {[{item:animal,val:a1,set:setA1,e:!!err&&!a1},{item:instr,val:a2,set:setA2,e:!!err&&!a2}].map(({item,val,set,e},i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="w-full h-[200px] bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden flex items-center justify-center">
              <img src={item.image} alt="" className="w-full h-full object-contain" />
            </div>
            <DInput value={val} onChange={set} placeholder="Название" hasError={e} />
          </div>
        ))}
      </div>
      <ErrMsg msg={err} />
      <PrimaryBtn onClick={submit} />
    </Card>
  )
}

// ─── Q3: Категория ────────────────────────────────────────────────────────────
const CATS = [
  {title:'Тарелка и кружка',answer:'Посуда'},{title:'Банан и яблоко',answer:'Фрукты'},
  {title:'Красный и синий',answer:'Цвета'},{title:'Платье и брюки',answer:'Одежда'},
  {title:'Кроссовки и туфли',answer:'Обувь'},{title:'Роза и тюльпан',answer:'Цветы'},
]

function Q3({ onAnswer }: { onAnswer: (p: number) => void }) {
  const [q]  = useState(() => rand(CATS))
  const [ans, setAns] = useState('')
  const [err, setErr] = useState('')

  const submit = () => {
    if (!ans) { setErr('Введите ответ'); return }
    onAnswer(ans.trim().toLowerCase()===q.answer.toLowerCase()?1:0)
  }

  return (
    <Card>
      <QTitle title="Ответьте на следующий вопрос:" />
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl px-5 py-4 mb-5 border border-blue-100">
        <p className="text-gray-800 font-semibold text-lg">{q.title} – это...</p>
      </div>
      <FieldLabel>Ваш ответ</FieldLabel>
      <DInput value={ans} onChange={setAns} placeholder="Название" hasError={!!err} />
      <ErrMsg msg={err} />
      <PrimaryBtn onClick={submit} />
    </Card>
  )
}

// ─── Q4: Монеты ───────────────────────────────────────────────────────────────
function Q4({ onAnswer }: { onAnswer: (p: number) => void }) {
  const [coin]  = useState(() => rand([5,10,20]) as number)
  const [count] = useState(() => rand([5,6,7,8,9]) as number)
  const total   = coin * count
  const [ans, setAns] = useState('')
  const [err, setErr] = useState('')

  const submit = () => {
    if (!ans) { setErr('Введите ответ'); return }
    onAnswer(parseInt(ans) === count ? 1 : 0)
  }

  return (
    <Card>
      <QTitle title={`Сколько ${coin}-тенговых монет в ${total} тенге?`} hint="Впишите ответ цифрами" />
      <DInput value={ans} onChange={setAns} placeholder="Ответ" type="number" hasError={!!err} />
      <ErrMsg msg={err} />
      <PrimaryBtn onClick={submit} />
    </Card>
  )
}

// ─── Q5: Сдача ────────────────────────────────────────────────────────────────
function Q5({ onAnswer }: { onAnswer: (p: number) => void }) {
  const [val] = useState(() => 2500 + Math.floor(Math.random()*2300))
  const [ans, setAns] = useState('')
  const [err, setErr] = useState('')

  const submit = () => {
    if (!ans) { setErr('Введите ответ'); return }
    onAnswer(parseInt(ans)===5000-val?1:0)
  }

  return (
    <Card>
      <QTitle title={`Вы сделали покупку на ${val} тенге, сколько сдачи с 5000 вы получите?`} hint="Впишите ответ цифрами" />
      <DInput value={ans} onChange={setAns} placeholder="Ответ" type="number" hasError={!!err} />
      <ErrMsg msg={err} />
      <PrimaryBtn onClick={submit} />
    </Card>
  )
}

// ─── Q6: Инструкция ───────────────────────────────────────────────────────────
function Q6({ onAnswer }: { onAnswer: (p: number) => void }) {
  return (
    <Card>
      <QTitle title="В последнем задании теста обязательно напишите фразу:" />
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-2">
        <p className="text-amber-900 font-semibold text-base leading-relaxed">В последнем задании обязательно напишите фразу:</p>
        <p className="text-amber-700 text-xl font-bold mt-2">«я закончил» или «я закончила»</p>
      </div>
      <PrimaryBtn onClick={() => onAnswer(0)} label="Понятно, продолжить →" />
    </Card>
  )
}

// ─── Q7: Соединение ───────────────────────────────────────────────────────────
const LABELS = ['1','А','2','Б','3','В','4','Г','5','Е']

function Q7({ onAnswer }: { onAnswer: (p: number) => void }) {
  const [nodes] = useState(() => {
    const xs = [10,30,50,70,90]
    const positions = [...xs.map(x=>[x,30]),...xs.map(x=>[x,70])]
    const sh = shuffle(positions)
    return LABELS.map((label,i) => ({ id:i, label, x:sh[i][0], y:sh[i][1] }))
  })
  const [path, setPath] = useState<number[]>([])
  const tap = (id: number) => { if (!path.includes(id) && path.length < LABELS.length) setPath(p => [...p,id]) }
  const pos: Record<number,[number,number]> = {}
  nodes.forEach(n => { pos[n.id] = [n.x, n.y] })
  const edges: [number,number][] = []
  for (let i=1; i<path.length; i++) edges.push([path[i-1], path[i]])

  const submit = () => {
    const byId: Record<number,string> = {}; nodes.forEach(n => { byId[n.id] = n.label })
    onAnswer(JSON.stringify(path.map(i=>byId[i]))===JSON.stringify(LABELS)?1:0)
  }

  return (
    <Card>
      <QTitle title="Соедините круги в правильном порядке" hint="Порядок: 1 — А — 2 — Б — 3 — В — 4 — Г — 5 — Е" />
      <div className="flex flex-wrap gap-2 mb-4 min-h-9">
        {path.map((id,i) => (
          <span key={i} className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{background:GRAD}}>
            {nodes.find(n=>n.id===id)?.label}
          </span>
        ))}
        {path.length < LABELS.length && <span className="w-8 h-8 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-xs">+</span>}
        {path.length > 0 && <button onClick={() => setPath([])} className="text-xs text-gray-400 hover:text-red-400 ml-1 self-center">сброс</button>}
      </div>
      <div className="relative w-full bg-gray-50 border-2 border-gray-200 rounded-2xl overflow-hidden" style={{height:210}}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          {edges.map(([a,b],i) => {
            const [x1,y1]=pos[a]??[0,0]; const [x2,y2]=pos[b]??[0,0]
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round"/>
          })}
        </svg>
        {nodes.map(n => {
          const picked = path.includes(n.id)
          return (
            <button key={n.id} onClick={() => tap(n.id)} disabled={picked}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center shadow transition-all active:scale-90"
              style={{ left:`${n.x}%`, top:`${n.y}%`, background:picked?'#e5e7eb':GRAD, color:picked?'#9ca3af':'white' }}>
              {n.label}
            </button>
          )
        })}
      </div>
      <PrimaryBtn onClick={submit} />
    </Card>
  )
}

// ─── Q8: Линии — фото из /images/test/lines/ ─────────────────────────────────
// Точно как в оригинале question-8.blade.php
const LINE_PAIRS = [
  { a: '/images/test/lines/4.jpg',  b: '/images/test/lines/4.jpg',  same: true  },
  { a: '/images/test/lines/5.jpg',  b: '/images/test/lines/5.jpg',  same: true  },
  { a: '/images/test/lines/6.jpg',  b: '/images/test/lines/7.jpg',  same: false },
  { a: '/images/test/lines/8.jpg',  b: '/images/test/lines/9.jpg',  same: false },
  { a: '/images/test/lines/10.jpg', b: '/images/test/lines/11.jpg', same: false },
  { a: '/images/test/lines/12.jpg', b: '/images/test/lines/13.jpg', same: false },
  { a: '/images/test/lines/14.jpg', b: '/images/test/lines/14.jpg', same: true  },
  { a: '/images/test/lines/15.jpg', b: '/images/test/lines/15.jpg', same: true  },
  { a: '/images/test/lines/16.jpg', b: '/images/test/lines/17.jpg', same: false },
  { a: '/images/test/lines/18.jpg', b: '/images/test/lines/19.jpg', same: false },
]

function Q8({ onAnswer }: { onAnswer: (p: number) => void }) {
  const [items] = useState(() => shuffle(LINE_PAIRS).slice(0,5))
  const [cur, setCur] = useState(0)
  const okRef = useRef(0)  // ref вместо state — нет stale closure

  const choose = (val: boolean) => {
    if (items[cur].same === val) okRef.current += 1
    if (cur < items.length - 1) {
      setCur(c => c + 1)
    } else {
      onAnswer(okRef.current)
    }
  }
  const item = items[cur]
  const pct  = Math.round((cur / items.length) * 100)

  return (
    <Card>
      <QTitle
        title="В этом тесте определите, одинаковые ли два узора из линий или разные"
        hint="Если одинаковы — нажмите «Одинаковые», если разные — «Разные»"
      />
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-gray-400">Пример {cur+1} из {items.length}</span>
        <div className="flex gap-1.5">
          {items.map((_,i) => <div key={i} className={`w-2 h-2 rounded-full transition-all ${i<cur?'bg-cyan-400':i===cur?'bg-gray-800':'bg-gray-200'}`}/>)}
        </div>
        <span className="text-xs text-gray-400">{pct}%</span>
      </div>
      {/* Три колонки: картинка | кнопки | картинка — как в оригинале */}
      <div className="grid grid-cols-3 items-center gap-3 mb-2">
        <div className="flex justify-center">
          <div className="w-full aspect-square bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
            <img src={item.a} alt="" className="w-full h-full object-contain" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => choose(true)}  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all active:scale-95">Одинаковые</button>
          <button onClick={() => choose(false)} className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-all active:scale-95">Разные</button>
        </div>
        <div className="flex justify-center">
          <div className="w-full aspect-square bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
            <img src={item.b} alt="" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─── Q9: Буквы ────────────────────────────────────────────────────────────────
// Оригинал: каждая пара = 0.4 очка, 5 пар × 0.4 = 2 очка макс
const LPAIRS = [
  {a:'ЖШЦСТЪ',   b:'ЖШЦСТЬ',   same:false},
  {a:'УКАБРД',   b:'УКАБРД',   same:true },
  {a:'ОРСЮДФ',   b:'ОРСДЮФ',   same:false},
  {a:'ГТШПРСТУЩ',b:'ГТШПРСТУЩ',same:true },
  {a:'ЦЧХВКЗ',   b:'ЦЧХВКЗ',   same:true },
]

function Q9({ onAnswer }: { onAnswer: (p: number) => void }) {
  const [items] = useState(() => shuffle(LPAIRS).slice(0,5))
  const [cur, setCur] = useState(0)
  const okRef = useRef(0)  // ref вместо state — нет stale closure

  const choose = (val: boolean) => {
    if (items[cur].same === val) okRef.current += 1
    if (cur < items.length - 1) {
      setCur(c => c + 1)
    } else {
      // 0.4 за каждую правильную пару — точно как в оригинале
      onAnswer(Math.round(okRef.current * 0.4 * 100) / 100)
    }
  }
  const item = items[cur]
  const pct  = Math.round((cur / items.length) * 100)

  return (
    <Card>
      <QTitle title="Определите, одинаковы ли две группы букв или разные" hint="Если одинаковы — «Одинаковые», если разные — «Разные»" />
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-gray-400">Пример {cur+1} из {items.length}</span>
        <div className="flex gap-1.5">
          {items.map((_,i) => <div key={i} className={`w-2 h-2 rounded-full transition-all ${i<cur?'bg-cyan-400':i===cur?'bg-gray-800':'bg-gray-200'}`}/>)}
        </div>
        <span className="text-xs text-gray-400">{pct}%</span>
      </div>
      {/* Буквы сверху, кнопки снизу на мобиле */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-center min-h-16">
            <span className="font-bold text-gray-900 font-mono text-center leading-snug text-sm sm:text-xl tracking-widest">{item.a}</span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-center min-h-16">
            <span className="font-bold text-gray-900 font-mono text-center leading-snug text-sm sm:text-xl tracking-widest">{item.b}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => choose(true)}  className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all active:scale-95">✓ Одинаковые</button>
          <button onClick={() => choose(false)} className="py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-all active:scale-95">✗ Разные</button>
        </div>
      </div>
    </Card>
  )
}

// ─── Q10: Фигуры — SVG из /images/test/ ──────────────────────────────────────
// Оригинал: a.svg=А, b.svg=Б, c.svg=В, d.svg=Г
// Каждая фигура = 0.5 очка, 4×0.5 = 2 очка макс
const FIGURES = [
  { title: 'А', image: '/images/test/a.svg' },
  { title: 'Б', image: '/images/test/b.svg' },
  { title: 'В', image: '/images/test/c.svg' },
  { title: 'Г', image: '/images/test/d.svg' },
]

function Q10({ onAnswer }: { onAnswer: (p: number) => void }) {
  const [shuffled]  = useState(() => shuffle(FIGURES))
  const [answers, setAnswers] = useState<string[]>(shuffled.map(()=>'0'))
  const [err, setErr] = useState('')

  const submit = () => {
    if (answers.some(a=>a==='0')) { setErr('Выберите все ответы'); return }
    const correct = shuffled.filter((fig,i) => fig.title === answers[i]).length
    // 0.5 за каждую правильную — точно как в оригинале
    onAnswer(Math.round(correct * 0.5 * 100) / 100)
  }

  return (
    <Card>
      <QTitle title="Вам даны 4 фигуры, обозначенные буквами от А до Г" />

      {/* Эталон — оригинальный порядок А Б В Г */}
      <div className="flex gap-4 mb-1">
        {FIGURES.map(({title,image}) => (
          <div key={title} className="flex flex-col items-center gap-1.5">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl overflow-hidden flex items-center justify-center">
              <img src={image} alt={title} className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-bold text-gray-700">{title}</span>
          </div>
        ))}
      </div>

      <div className="my-4 flex items-center gap-2">
        <div className="flex-1 h-px bg-gray-200"/><span className="text-xs text-gray-400">перемешанные</span><div className="flex-1 h-px bg-gray-200"/>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {shuffled.map((fig,i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-full aspect-square bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center">
              <img src={fig.image} alt="" className="w-full h-full object-contain" />
            </div>
            <select
              value={answers[i]}
              onChange={e => setAnswers(p => { const n=[...p]; n[i]=e.target.value; return n })}
              className="w-full text-center px-1 py-2 rounded-xl border-2 border-gray-200 bg-white text-sm outline-none focus:border-cyan-400"
            >
              <option value="0" disabled>?</option>
              {['А','Б','В','Г'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        ))}
      </div>
      <ErrMsg msg={err} />
      <PrimaryBtn onClick={submit} />
    </Card>
  )
}

// ─── Q11: Финал ───────────────────────────────────────────────────────────────
function Q11({ onAnswer, isAuth }: { onAnswer: (p: number, extra?: object) => void; isAuth: boolean }) {
  const [answer, setAnswer]     = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [firstName, setFirst]   = useState('')
  const [lastName, setLast]     = useState('')
  const [middleName, setMiddle] = useState('')
  const [consent, setConsent]   = useState(false)
  const [err, setErr]           = useState<Record<string,string>>({})

  const submit = () => {
    const e: Record<string,string> = {}
    if (!answer)    e.answer = 'Введите фразу'
    if (!firstName) e.first  = 'Введите имя'
    if (!lastName)  e.last   = 'Введите фамилию'
    if (!isAuth) {
      if (!email) {
        e.email = 'Введите email'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        e.email = 'Введите корректный email'
      }
      if (phone && !/^[\d\s+()\-]{7,20}$/.test(phone)) {
        e.phone = 'Введите корректный номер'
      }
    }
    if (!consent)   e.consent = 'Необходимо согласие'
    if (Object.keys(e).length) { setErr(e); return }
    const v = answer.trim().toLowerCase()
    onAnswer((v==='я закончил'||v==='я закончила')?1:0, {
      email:email||undefined, phone:phone||undefined,
      first_name:firstName, last_name:lastName, middle_name:middleName||undefined,
    })
  }

  return (
    <Card>
      <QTitle title="Вы всё сделали?" hint="Последний вопрос — заполните данные для результата" />
      <div className="space-y-4">
        <div>
          <FieldLabel>Впишите ответ</FieldLabel>
          <DInput value={answer} onChange={setAnswer} placeholder="Ответ" hasError={!!err.answer} />
          <ErrMsg msg={err.answer||''} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Фамилия *</FieldLabel>
            <DInput value={lastName} onChange={setLast} placeholder="Фамилия" hasError={!!err.last} />
            <ErrMsg msg={err.last||''} />
          </div>
          <div>
            <FieldLabel>Имя *</FieldLabel>
            <DInput value={firstName} onChange={setFirst} placeholder="Имя" hasError={!!err.first} />
            <ErrMsg msg={err.first||''} />
          </div>
          <div className="col-span-2">
            <FieldLabel>Отчество</FieldLabel>
            <DInput value={middleName} onChange={setMiddle} placeholder="Отчество (необязательно)" />
          </div>
          {!isAuth && (
            <>
              <div>
                <FieldLabel>Электронная почта *</FieldLabel>
                <DInput value={email} onChange={setEmail} placeholder="example@mail.com" type="email" hasError={!!err.email} />
                <ErrMsg msg={err.email||''} />
              </div>
              <div>
                <FieldLabel>Телефон</FieldLabel>
                <DInput value={phone} onChange={v => {
                  const digits = v.replace(/\D/g, '').slice(0, 11)
                  setPhone(digits ? '+' + digits : '')
                }} placeholder="+7 (___) ___-__-__" hasError={!!err.phone} />
                <ErrMsg msg={err.phone||''} />
              </div>
            </>
          )}
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-cyan-500 flex-shrink-0" />
          <span className="text-xs text-gray-500 leading-relaxed">
            Я даю согласие на обработку моих персональных данных, включая медицинские данные,
            в соответствии с{' '}
            <a href="#" className="text-cyan-500 hover:underline">Политикой конфиденциальности</a>{' '}
            и <a href="#" className="text-cyan-500 hover:underline">Пользовательским соглашением</a>.{' '}
            <span className="text-red-400">*</span>
          </span>
        </label>
        <ErrMsg msg={err.consent||''} />
      </div>
      <PrimaryBtn onClick={submit} label="Получить результат →" />
    </Card>
  )
}

// ─── Модальное окно подтверждения ─────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 w-full max-w-sm">
        <p className="text-gray-800 font-semibold text-center mb-6">{message}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">Отмена</button>
          <button onClick={onConfirm} className="py-3 rounded-2xl text-white font-semibold text-sm transition hover:opacity-90" style={{background:GRAD}}>Подтвердить</button>
        </div>
      </div>
    </div>
  )
}

// ─── Главный компонент ────────────────────────────────────────────────────────
export default function TestPage() {
  const navigate  = useNavigate()
  const { token } = useAuthStore()
  const [test, setTest]       = useState<Test|null>(null)
  const [curQ, setCurQ]       = useState(0)
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState<'restart'|'finish'|null>(null)

  // useRef — чтобы submit всегда читал свежие значения (stale closure fix)
  const testRef    = useRef<Test|null>(null)
  const curQRef    = useRef(0)
  const loadingRef = useRef(false)

  const initializingRef = useRef(false)

  const initTest = useCallback(() => {
    if (initializingRef.current) return   // защита от двойного вызова (StrictMode / React 18)
    initializingRef.current = true
    setTest(null); setCurQ(0); setStarted(false)
    testRef.current = null; curQRef.current = 0
    ;(token ? testsApi.start() : testsApi.startGuest()).then(r => {
      const t = r.data as Test
      setTest(t); testRef.current = t
    }).finally(() => { initializingRef.current = false })
  }, [token])

  useEffect(() => { initTest() }, [])

  const submit = useCallback(async (point: number, extra?: object) => {
    const t  = testRef.current
    const cq = curQRef.current
    if (!t || loadingRef.current) return
    const q      = QUESTIONS[cq]
    const isLast = cq === QUESTIONS.length - 1
    loadingRef.current = true; setLoading(true)
    const nq = isLast ? 12 : q.id + 1
    console.warn(`[SUBMIT] curQRef=${cq} q.id=${q.id} isLast=${isLast} next_question=${nq}`)
    try {
      await testsApi.answer(t.hash, {
        current_question: q.id, answer: String(point), point,
        next_question: nq, ...(extra || {})
      })
      if (isLast) {
        navigate(`/report/${t.hash}`)
      } else {
        curQRef.current = cq + 1
        setCurQ(cq + 1)
      }
    } catch(e) { console.error(e) }
    finally { loadingRef.current = false; setLoading(false) }
  }, [navigate])

  if (!test) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"/>
        <span className="text-sm">Загрузка теста…</span>
      </div>
    </div>
  )

  const q        = QUESTIONS[curQ]
  const progress = Math.round((curQ/QUESTIONS.length)*100)

  // ── Стартовый экран ───────────────────────────────────────────────────────
  if (!started) return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 text-white" style={{background:GRAD}}>
          <div className="text-5xl mb-4">🧠</div>
          <h1 className="text-2xl font-bold mb-1">Тест когнитивного здоровья</h1>
          <p className="opacity-80 text-sm">Оценка памяти, внимания и когнитивных функций</p>
        </div>
        <div className="p-8 space-y-4">
          {[
            ['📋','Тест состоит из 11 вопросов для оценки разных когнитивных функций'],
            ['⏱️','Прохождение займёт примерно 5–7 минут'],
            ['🔇','Отвечайте без посторонней помощи и не отвлекайтесь'],
            ['📊','В конце получите короткий отчёт с рекомендациями'],
          ].map(([icon,text]) => (
            <div key={text as string} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">{icon}</div>
              <span className="text-gray-700 text-sm">{text}</span>
            </div>
          ))}
          <button onClick={()=>setStarted(true)} className="w-full mt-2 py-4 rounded-2xl text-white font-bold text-base transition hover:opacity-90 active:scale-95" style={{background:GRAD}}>
            Начать тестирование
          </button>
          <div className="text-center">
            <Link to="/test" className="text-xs text-gray-400 hover:text-gray-600">← Назад</Link>
          </div>
        </div>
      </div>
    </div>
  )

  const render = () => {
    switch (q.type) {
      case 'date':        return <Q1  onAnswer={p=>submit(p)} />
      case 'images':      return <Q2  onAnswer={p=>submit(p)} />
      case 'category':    return <Q3  onAnswer={p=>submit(p)} />
      case 'coins':       return <Q4  onAnswer={p=>submit(p)} />
      case 'change':      return <Q5  onAnswer={p=>submit(p)} />
      case 'instruction': return <Q6  onAnswer={p=>submit(p)} />
      case 'connect':     return <Q7  onAnswer={p=>submit(p)} />
      case 'lines':       return <Q8  onAnswer={p=>submit(p)} />
      case 'letters':     return <Q9  onAnswer={p=>submit(p)} />
      case 'figures':     return <Q10 onAnswer={p=>submit(p)} />
      case 'final':       return <Q11 onAnswer={(p,e)=>submit(p,e)} isAuth={!!token} />
      default:            return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Шапка теста */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Вопрос <span className="text-gray-900 font-bold">{curQ+1}</span> из {QUESTIONS.length}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-cyan-600">{progress}%</span>
            <div className="flex gap-1.5 ml-2">
              <button onClick={() => setConfirm('restart')}
                className="px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-500 hover:bg-gray-100 transition">
                ↺ Заново
              </button>
              <button onClick={() => setConfirm('finish')}
                className="px-3 py-1.5 rounded-full border border-red-200 text-xs text-red-500 hover:bg-red-50 transition">
                ✕ Завершить
              </button>
            </div>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{width:`${progress}%`, background:GRAD}}/>
        </div>
      </div>

      {render()}

      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"/>
        </div>
      )}

      {confirm === 'restart' && (
        <ConfirmModal
          message="Начать тест заново? Весь прогресс будет потерян."
          onConfirm={() => { setConfirm(null); initTest() }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'finish' && (
        <ConfirmModal
          message="Завершить тест? Результат не будет сохранён."
          onConfirm={() => { setConfirm(null); navigate('/dashboard') }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
