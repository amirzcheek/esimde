export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '—'
  return timeStr.slice(0, 5)
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  return phone
}

export function getScoreColor(score: number | null | undefined): string {
  if (score == null) return 'text-gray-400'
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
}

export function getScoreLabel(score: number | null | undefined): string {
  if (score == null) return 'Нет данных'
  if (score >= 80) return 'Норма'
  if (score >= 60) return 'Внимание'
  return 'Критично'
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export const STATUS_LABELS: Record<string, string> = {
  pending:   'Ожидает',
  confirmed: 'Подтверждён',
  cancelled: 'Отменён',
  completed: 'Завершён',
  no_show:   'Не явился',
}

export const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
  no_show:   'bg-gray-100 text-gray-600',
}

export const STATUS_BADGE = STATUS_COLORS
