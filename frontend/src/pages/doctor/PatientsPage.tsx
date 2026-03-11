import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { patientsApi } from '@/api'
import { formatPhone, getScoreColor } from '@/lib/utils'
import type { Patient } from '@/types'
import { Search, ChevronRight, FlaskConical, AlertTriangle } from 'lucide-react'

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.list().then(r => r.data as Patient[]),
  })

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone && p.phone.includes(search)),
  )

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Мои пациенты</h1>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Поиск по имени или телефону…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p>Пациенты не найдены</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <Link key={p.id} to={`/doctor/patients/${p.id}`}
              className="card flex items-center gap-4 py-4 hover:shadow-card-hover transition group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
                {p.name.split(' ').slice(0,2).map(s => s[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {p.age && <span className="text-xs text-gray-500">{p.age} лет</span>}
                  {p.city && <span className="text-xs text-gray-400">{p.city}</span>}
                  {p.phone && <span className="text-xs text-gray-400">{formatPhone(p.phone)}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {p.last_test_score !== null && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                      <FlaskConical size={11} /> Тест
                    </div>
                    <span className={`font-mono text-sm font-bold ${getScoreColor(p.last_test_score)}`}>
                      {p.last_test_score.toFixed(0)}%
                    </span>
                  </div>
                )}
                {(p as any).has_test && !(p as any).has_conclusion && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200">
                    <AlertTriangle size={11} />
                    Заполнить заключение
                  </div>
                )}
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
