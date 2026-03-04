import { Link } from 'react-router-dom'

interface Props {
  to?: string
  onClick?: () => void
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  outline?: boolean  // white bg with gradient border+text
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}

const PLAY_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
  </svg>
)

// Solid gradient button (cyan→blue, white text)
export function GradBtn({ to, onClick, children, className = '', type = 'button', disabled }: Props) {
  const cls = `btn-grad ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`
  if (to) return <Link to={to} className={cls}>{children}</Link>
  return <button type={type} onClick={onClick} className={cls} disabled={disabled}>{children}</button>
}

// Outline button: gradient border, white bg, gradient text + play icon
export function GradBtnOutline({ to, onClick, children, className = '' }: Props) {
  const inner = (
    <span>
      <span className="btn-text">{children}</span>
      <span className="btn-icon text-white">{PLAY_ICON}</span>
    </span>
  )
  const cls = `btn-grad-outline ${className}`
  if (to) return <Link to={to} className={cls}>{inner}</Link>
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>
}

// Solid with play icon (used on landing sections)
export function GradBtnPlay({ to, onClick, children, className = '' }: Props) {
  const inner = (
    <>
      <span className="font-semibold text-white text-xl">{children}</span>
      <span className="bg-white w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 text-blue-400">
        {PLAY_ICON}
      </span>
    </>
  )
  const cls = `btn-grad ${className}`
  if (to) return <Link to={to} className={cls}>{inner}</Link>
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>
}
