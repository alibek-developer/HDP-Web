'use client'

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Search,
  X,
} from 'lucide-react'

export const cn = (...values: ClassValue[]) => clsx(values)

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'dark'
type ButtonSize = 'sm' | 'md' | 'icon'

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-white shadow-brand hover:bg-brand-hover hover:shadow-brand-hover active:bg-brand-active',
  secondary:
    'bg-brand-soft text-brand-text border border-line-brand hover:bg-[#e4f7eb]',
  destructive:
    'bg-error-bg text-error border border-[#fecaca] hover:bg-[#fde8e8]',
  ghost: 'bg-transparent text-ink-2 hover:bg-hover hover:text-ink',
  dark: 'bg-ink text-white hover:bg-[#1f2937]',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  icon: 'h-8 w-8 text-ink-3',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap rounded-lg font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  )
})

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-md text-ink-3 transition hover:bg-hover hover:text-ink-2',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export type BadgeTone = 'brand' | 'gray' | 'info' | 'success' | 'danger' | 'warning' | 'coin' | 'violet'

const badgeTones: Record<BadgeTone, string> = {
  brand: 'bg-brand-soft text-brand-text',
  gray: 'bg-muted text-ink-3',
  info: 'bg-info-bg text-info',
  success: 'bg-success-bg text-success',
  danger: 'bg-error-bg text-error',
  warning: 'bg-warning-bg text-warning',
  coin: 'bg-coin-bg text-[#b45309]',
  violet: 'bg-[#ede9fe] text-[#6d28d9]',
}

export function Badge({
  tone = 'gray',
  children,
  className,
  dot,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[12px] font-semibold leading-none',
        badgeTones[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}

export function DifficultyBadge({ level }: { level: 'easy' | 'medium' | 'hard' | 'olympiad' }) {
  const map = {
    easy: { tone: 'success' as BadgeTone, label: 'Oson' },
    medium: { tone: 'warning' as BadgeTone, label: "O'rta" },
    hard: { tone: 'danger' as BadgeTone, label: 'Qiyin' },
    olympiad: { tone: 'info' as BadgeTone, label: 'Olimpiada' },
  }
  const item = map[level]
  return <Badge tone={item.tone}>{item.label}</Badge>
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('card', className)}>{children}</div>
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('card p-0', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-2 px-5 py-4">
        <div>
          <h3 className="h4 text-ink">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-[12px] text-ink-3">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

export function StatCard({
  label,
  value,
  trend,
  trendTone = 'up',
  icon,
  iconClass,
  hint,
  className,
}: {
  label: ReactNode
  value: ReactNode
  trend?: ReactNode
  trendTone?: 'up' | 'down'
  icon?: ReactNode
  iconClass?: string
  hint?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('card card-hover group', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-3">{label}</p>
        {icon ? (
          <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full', iconClass ?? 'bg-brand-soft text-brand')}>
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-3 font-display text-[30px] font-extrabold leading-none tracking-[-0.02em] text-ink tabular">
        {value}
      </div>
      {trend ? (
        <p className={cn('mt-2.5 text-[12px] font-medium', trendTone === 'up' ? 'text-success' : 'text-error')}>
          {trend}
        </p>
      ) : null}
      {hint ? <p className="mt-2.5 text-[12px] text-ink-3">{hint}</p> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* CountUp                                                             */
/* ------------------------------------------------------------------ */

export function CountUp({
  value,
  duration = 1200,
  format = (input: number) => String(Math.round(input)),
  className,
  suffix,
}: {
  value: number
  duration?: number
  format?: (value: number) => string
  className?: string
  suffix?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [started, setStarted] = useState(false)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let frame = 0
    const start = performance.now()
    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / duration)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(value * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
      else setDisplay(value)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [started, value, duration])

  return (
    <span ref={ref} className={className}>
      {format(display)}
      {suffix}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label className="flex items-center gap-1 text-[13px] font-semibold text-ink-2">
          {label}
          {required ? <span className="text-error">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <p className="text-[12px] text-error">{error}</p> : null}
      {!error && hint ? <p className="text-[12px] text-ink-3">{hint}</p> : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn('field', className)} {...props} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn('field field-area', className)} {...props} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn('field cursor-pointer appearance-none pr-9', className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
      </div>
    )
  },
)

export function Checkbox({
  checked,
  onChange,
  label,
  className,
  indeterminate,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  className?: string
  indeterminate?: boolean
}) {
  return (
    <label className={cn('inline-flex cursor-pointer select-none items-center gap-2 text-[13px] text-ink-2', className)}>
      <span
        className={cn(
          'grid h-4 w-4 shrink-0 place-items-center rounded border transition',
          checked || indeterminate ? 'border-brand bg-brand text-white' : 'border-[#d1d5db] bg-white',
        )}
      >
        {indeterminate ? (
          <span className="h-0.5 w-2 rounded bg-white" />
        ) : checked ? (
          <Check className="h-3 w-3" strokeWidth={3} />
        ) : null}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  size = 'md',
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}) {
  const width = size === 'sm' ? 'h-[20px] w-[36px]' : 'h-6 w-11'
  const knob = size === 'sm' ? 'h-3.5 w-3.5' : 'h-[18px] w-[18px]'
  const offset = size === 'sm' ? 'translate-x-[17px]' : 'translate-x-5'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50',
        width,
        checked ? 'bg-brand' : 'bg-[#d1d5db]',
      )}
    >
      <span
        className={cn(
          'ml-0.5 inline-block rounded-full bg-white shadow-sm transition-transform duration-200',
          knob,
          checked ? offset : 'translate-x-0',
        )}
      />
    </button>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Qidirish...',
  className,
  onClear,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onClear?: () => void
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field pl-9 pr-8"
      />
      {value ? (
        <button
          type="button"
          aria-label="Tozalash"
          onClick={() => (onClear ? onClear() : onChange(''))}
          className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-ink-3 hover:bg-muted"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: ReactNode; count?: number }>
  className?: string
}) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition',
              active ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3 hover:text-ink-2',
            )}
          >
            {option.label}
            {typeof option.count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] tabular',
                  active ? 'bg-brand-soft text-brand-text' : 'bg-white/70 text-ink-3',
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T
  onChange: (value: T) => void
  items: Array<{ value: T; label: ReactNode; count?: number }>
  className?: string
}) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-line no-scrollbar', className)}>
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              'relative shrink-0 px-3 pb-2.5 pt-1 text-[13px] font-semibold transition',
              active ? 'text-brand-text' : 'text-ink-3 hover:text-ink-2',
            )}
          >
            <span className="flex items-center gap-1.5">
              {item.label}
              {typeof item.count === 'number' ? (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-ink-3 tabular">{item.count}</span>
              ) : null}
            </span>
            {active ? (
              <motion.span layoutId="tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modal / Drawer                                                      */
/* ------------------------------------------------------------------ */

const useMounted = () => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

const useLockBody = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [locked])
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const mounted = useMounted()
  useLockBody(open)

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!mounted) return null

  const widths = { sm: 'max-w-md', md: 'max-w-[560px]', lg: 'max-w-3xl', xl: 'max-w-5xl' }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="admin-theme fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 backdrop-blur-[4px] sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={cn(
              'flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-modal sm:rounded-2xl',
              widths[size],
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line-2 px-6 py-4">
              <div>
                <h2 className="h3 text-ink">{title}</h2>
                {description ? <p className="mt-1 text-[12px] text-ink-3">{description}</p> : null}
              </div>
              <IconButton label="Yopish" onClick={onClose}>
                <X className="h-4 w-4" />
              </IconButton>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer ? (
              <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line-2 bg-canvas px-6 py-3.5">
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  widthClass = 'sm:w-[480px]',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  widthClass?: string
}) {
  const mounted = useMounted()
  useLockBody(open)

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="admin-theme fixed inset-0 z-[100] bg-black/40 backdrop-blur-[4px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            className={cn('ml-auto flex h-full w-full flex-col bg-white shadow-modal', widthClass)}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line-2 px-5 py-4">
              <div>
                <h2 className="h3 text-ink">{title}</h2>
                {subtitle ? <div className="mt-0.5 text-[12px] text-ink-3">{subtitle}</div> : null}
              </div>
              <IconButton label="Yopish" onClick={onClose}>
                <X className="h-4 w-4" />
              </IconButton>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer ? <footer className="border-t border-line-2 bg-canvas px-5 py-3">{footer}</footer> : null}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

/* ------------------------------------------------------------------ */
/* Dropdown                                                            */
/* ------------------------------------------------------------------ */

export interface DropdownItem {
  label: string
  icon?: ReactNode
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
  separator?: boolean
}

export function Dropdown({
  trigger,
  items,
  align = 'right',
  className,
}: {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div onClick={() => setOpen((value) => !value)}>{trigger}</div>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className={cn(
              'absolute top-full z-50 mt-2 min-w-[190px] overflow-hidden rounded-xl border border-line bg-white p-1 shadow-modal',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {items.map((item, index) =>
              item.separator ? (
                <div key={`sep-${index}`} className="my-1 h-px bg-line-2" />
              ) : (
                <button
                  key={item.label}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false)
                    item.onClick?.()
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition hover:bg-canvas disabled:opacity-40',
                    item.danger ? 'text-error hover:bg-error-bg' : 'text-ink-2',
                  )}
                >
                  {item.icon ? <span className="grid h-4 w-4 place-items-center">{item.icon}</span> : null}
                  {item.label}
                </button>
              ),
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Avatar / Progress / Empty                                           */
/* ------------------------------------------------------------------ */

export function Avatar({
  name,
  tone,
  size = 'md',
  verified,
  className,
}: {
  name: string
  tone?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  verified?: boolean
  className?: string
}) {
  const sizes = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-[13px]',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-16 w-16 text-xl',
  }
  const letters = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  return (
    <span className={cn('relative inline-grid shrink-0 place-items-center rounded-full font-semibold', sizes[size], tone ?? 'bg-brand-soft text-brand-text', className)}>
      {letters}
      {verified ? (
        <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-brand text-white ring-2 ring-white">
          <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
        </span>
      ) : null}
    </span>
  )
}

export function ProgressBar({
  value,
  tone = 'brand',
  height = 4,
  className,
  animated = true,
}: {
  value: number
  tone?: 'brand' | 'coin' | 'info' | 'danger' | 'gradient'
  height?: number
  className?: string
  animated?: boolean
}) {
  const tones = {
    brand: 'bg-brand',
    coin: 'bg-coin',
    info: 'bg-xp',
    danger: 'bg-error',
    gradient: 'bg-gradient-to-r from-[#22c55e] to-[#15803d]',
  }
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-brand-container', className)} style={{ height }}>
      <motion.div
        initial={animated ? { width: 0 } : false}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={cn('h-full rounded-full', tones[tone])}
      />
    </div>
  )
}

export function EmptyState({
  title,
  text,
  icon,
  action,
}: {
  title: string
  text?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-ink-3">
        {icon ?? <Info className="h-5 w-5" />}
      </div>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      {text ? <p className="mt-1 max-w-sm text-[13px] text-ink-3">{text}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-shimmer rounded-md', className)} />
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

export function Pagination({
  page,
  pageCount,
  onChange,
  total,
  pageSize,
  label = 'ta',
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
  total: number
  pageSize: number
  label?: string
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const pages: Array<number | '...'> = []
  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i += 1) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(pageCount - 1, page + 1); i += 1) pages.push(i)
    if (page < pageCount - 2) pages.push('...')
    pages.push(pageCount)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-[12px] text-ink-3">
        <span className="font-semibold text-ink-2">{from}</span>–<span className="font-semibold text-ink-2">{to}</span>{' '}
        / {total} {label} ko'rsatilmoqda
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Oldingi sahifa"
          className="grid h-8 w-8 place-items-center rounded-md border border-line text-ink-3 transition hover:bg-canvas disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((item, index) =>
          item === '...' ? (
            <span key={`dots-${index}`} className="px-1 text-ink-3">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className={cn(
                'h-8 min-w-8 rounded-md px-2 text-[12px] font-semibold transition',
                item === page
                  ? 'bg-brand text-white'
                  : 'border border-line text-ink-2 hover:bg-canvas',
              )}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          aria-label="Keyingi sahifa"
          className="grid h-8 w-8 place-items-center rounded-md border border-line text-ink-3 transition hover:bg-canvas disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */

type ToastTone = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

interface ToastContextValue {
  toast: (payload: { title: string; description?: string; tone?: ToastTone }) => void
}

const ToastContextInternal = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const remove = (id: number) => setItems((current) => current.filter((item) => item.id !== id))

  const toast = ({
    title,
    description,
    tone = 'success',
  }: {
    title: string
    description?: string
    tone?: ToastTone
  }) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setItems((current) => [...current.slice(-3), { id, title, description, tone }])
    window.setTimeout(() => remove(id), 3600)
  }

  const icons: Record<ToastTone, ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-success" />,
    error: <AlertTriangle className="h-5 w-5 text-error" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning" />,
    info: <Info className="h-5 w-5 text-info" />,
  }

  return (
    <ToastContextInternal.Provider value={{ toast }}>
      {children}
      {mounted ? mountedToasts(items, remove, icons) : null}
    </ToastContextInternal.Provider>
  )
}

const mountedToasts = (
  items: ToastItem[],
  remove: (id: number) => void,
  icons: Record<ToastTone, ReactNode>,
) => {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="admin-theme pointer-events-none fixed right-4 top-4 z-[200] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-white p-3.5 shadow-modal"
          >
            <span className="mt-0.5 shrink-0">{icons[item.tone]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ink">{item.title}</p>
              {item.description ? <p className="mt-0.5 text-[12px] text-ink-3">{item.description}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => remove(item.id)}
              aria-label="Yopish"
              className="mt-0.5 text-ink-3 transition hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContextInternal)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
