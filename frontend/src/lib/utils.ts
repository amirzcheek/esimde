export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  return phone
}

export function getScoreColor(score: number | null): string {
  if (score === null) return 'text-gray-400'
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
}

export function getScoreLabel(score: number | null): string {
  if (score === null) return 'Нет данных'
  if (score >= 80) return 'Норма'
  if (score >= 60) return 'Внимание'
  return 'Критично'
}

export const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
  no_show:   'bg-gray-100 text-gray-600',
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}