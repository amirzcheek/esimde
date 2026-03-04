import { cn } from '@/lib/utils'
import { statusLabel, typeLabel } from '@/utils/format'
import type { AppointmentStatus } from '@/types'

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn(
      'inline-block border-2 border-current border-t-transparent rounded-full animate-spin',
      className ?? 'w-5 h-5',
    )} />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner className="w-8 h-8 text-brand-500" />
    </div>
  )
}

// ─── Badges ───────────────────────────────────────────────────────────────────
const statusBadgeClass: Record<AppointmentStatus, string> = {
  pending:   'badge badge-pending',
  confirmed: 'badge badge-confirmed',
  completed: 'badge badge-completed',
  cancelled: 'badge badge-cancelled',
  no_show:   'badge badge-no_show',
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={statusBadgeClass[status]}>
      {statusLabel[status] ?? status}
    </span>
  )
}

export function TypeBadge({ type }: { type: string }) {
  const isOnline = type === 'online'
  return (
    <span className={cn('badge', isOnline
      ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
      : 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
    )}>
      {isOnline ? '🌐' : '📍'} {typeLabel[type] ?? type}
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({
  name, src, size = 'md', className,
}: {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }[size]

  if (src) {
    return (
      <img
        src={src.startsWith('http') ? src : `/uploads/${src}`}
        alt={name}
        className={cn('rounded-xl object-cover flex-shrink-0', sz, className)}
      />
    )
  }

  return (
    <div className={cn(
      'rounded-xl bg-gradient-to-br from-brand-400 to-brand-600',
      'flex items-center justify-center font-semibold text-white flex-shrink-0',
      sz, className,
    )}>
      {initials || '?'}
    </div>
  )
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────
export function ScoreBar({ score }: { score: number }) {
  const clamped = Math.min(Math.max(score, 0), 100)
  return (
    <div className="relative">
      <div className="h-3 w-full rounded-full overflow-hidden bg-gradient-to-r from-red-400 via-amber-300 to-brand-400" />
      <div
        className="absolute top-0 h-3 w-0.5 bg-gray-900 rounded-full transition-all duration-700 shadow-sm"
        style={{ left: `${Math.min(clamped, 97)}%` }}
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>0%</span>
        <span className="font-semibold text-gray-700">{clamped.toFixed(0)}%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({
  icon, title, description, action,
}: {
  icon: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <span className="text-4xl">{icon}</span>
      <p className="font-semibold text-gray-700">{title}</p>
      {description && <p className="text-sm text-gray-400 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
export function SectionHeader({
  title, subtitle, action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({
  open, title, description, onConfirm, onCancel, confirmLabel = 'Подтвердить', danger = false,
}: {
  open: boolean
  title: string
  description?: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  danger?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-modal p-6 w-full max-w-sm mx-4 animate-slide-up">
        <h2 className="font-semibold text-gray-900 mb-2">{title}</h2>
        {description && <p className="text-sm text-gray-500 mb-5">{description}</p>}
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary flex-1">Отмена</button>
          <button
            onClick={onConfirm}
            className={cn('flex-1', danger ? 'btn-danger' : 'btn-primary')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
