import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { AppointmentStatus } from '@/types'

export const formatDate = (d: string | null | undefined) =>
  d ? format(parseISO(d), 'd MMMM yyyy', { locale: ru }) : '—'

export const formatDateShort = (d: string | null | undefined) =>
  d ? format(parseISO(d), 'dd.MM.yyyy', { locale: ru }) : '—'

export const formatTime = (t: string | null | undefined) => t ? t.slice(0, 5) : '—'

export const formatDateTime = (d: string | null | undefined) =>
  d ? format(parseISO(d), 'd MMM yyyy, HH:mm', { locale: ru }) : '—'

export const formatPhone = (p: string | null | undefined) => {
  if (!p) return '—'
  const d = p.replace(/\D/g, '')
  if (d.length === 11)
    return `+${d[0]} (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`
  return p
}

export const statusLabel: Record<AppointmentStatus, string> = {
  pending:   'Ожидает',
  confirmed: 'Подтверждена',
  cancelled: 'Отменена',
  completed: 'Завершена',
  no_show:   'Не явился',
}

export const typeLabel: Record<string, string> = {
  online: 'Онлайн',
  offline: 'Офлайн',
  both: 'Онлайн / Офлайн',
}

export const dayLabel: Record<number, string> = {
  1: 'Понедельник', 2: 'Вторник', 3: 'Среда',
  4: 'Четверг', 5: 'Пятница', 6: 'Суббота', 7: 'Воскресенье',
}
