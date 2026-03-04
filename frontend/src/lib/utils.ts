import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { AppointmentStatus } from '@/types'

export const cn = (...i: ClassValue[]) => twMerge(clsx(i))
export const formatDate = (s?: string|null) => s ? new Date(s).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—'
export const formatTime = (s?: string|null) => s ? s.slice(0,5) : '—'
export const formatPhone = (p?: string|null) => { if (!p) return '—'; const d = p.replace(/\D/g,''); return d.length===11 ? `+7 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7,9)}-${d.slice(9)}` : `+${d}` }

export const STATUS_LABELS: Record<AppointmentStatus,string> = {
  pending:'Ожидание', confirmed:'Подтверждено', cancelled:'Отменено', completed:'Завершено', no_show:'Не явился'
}
export const STATUS_BADGE: Record<AppointmentStatus,string> = {
  pending:'badge badge-pending', confirmed:'badge badge-confirmed',
  cancelled:'badge badge-cancelled', completed:'badge badge-completed', no_show:'badge badge-no_show'
}
export const getScoreColor = (s: number) => s < 40 ? 'text-red-600' : s < 70 ? 'text-amber-600' : 'text-green-600'
export const getScoreLabel = (s: number) => s < 40 ? 'Требует внимания врача' : s < 70 ? 'Незначительные отклонения' : 'В норме'
