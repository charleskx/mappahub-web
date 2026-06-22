import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { I } from '../icons'

// ── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'lg' | 'icon'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({
  variant = 'secondary',
  size,
  leftIcon,
  rightIcon,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}${className ? ` ${className}` : ''}`}
      data-size={size}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  )
}

// ── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  invalid?: boolean
}

export function Input({ icon, invalid, ...props }: InputProps) {
  if (icon) {
    return (
      <div className="input-with-icon">
        {icon}
        <input className="input" data-invalid={invalid || undefined} {...props} />
      </div>
    )
  }
  return <input className="input" data-invalid={invalid || undefined} {...props} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="textarea" {...props} />
}

export function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select className="select input" {...props}>
      {children}
    </select>
  )
}

// ── Field ────────────────────────────────────────────────────────────────────
interface FieldProps {
  label?: React.ReactNode
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export function Field({ label, hint, error, required, children }: FieldProps) {
  return (
    <div className="input-group">
      {label && (
        <label className="label">
          {label}
          {required && <span className="required"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <div className="error-text">
          <I.alert size={12} />
          {error}
        </div>
      ) : hint ? (
        <div className="help">{hint}</div>
      ) : null}
    </div>
  )
}

// ── Checkbox / Switch / Radio ─────────────────────────────────────────────────
export function Checkbox({
  checked,
  onChange,
  label,
  indeterminate,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: React.ReactNode
  indeterminate?: boolean
}) {
  const active = checked || indeterminate
  const box = (
    <span className="checkbox" data-checked={active}>
      {indeterminate && !checked ? (
        <span style={{ display: 'block', width: 8, height: 2, background: 'currentColor', borderRadius: 1 }} />
      ) : checked ? (
        <I.check size={11} />
      ) : null}
    </span>
  )
  if (label) {
    return (
      <label className="checkbox-label" onClick={() => onChange(!checked)}>
        {box}
        {label}
      </label>
    )
  }
  return (
    <span onClick={() => onChange(!checked)} style={{ display: 'inline-flex' }}>
      {box}
    </span>
  )
}

export function Switch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <span
      className="switch"
      data-checked={checked}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
    />
  )
}

export function Radio({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return <span className="radio" data-checked={checked} onClick={onChange} />
}

// ── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps {
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'accent'
  dot?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
}

export function Badge({ tone, dot, children, style }: BadgeProps) {
  return (
    <span className="badge" data-tone={tone} style={style}>
      {dot && <span className="dot" />}
      {children}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={`card${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  desc,
  action,
}: {
  title: React.ReactNode
  desc?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="card-header">
      <div>
        <div className="card-title">{title}</div>
        {desc && <div className="card-desc">{desc}</div>}
      </div>
      {action}
    </div>
  )
}

// ── Tabs / Segmented ──────────────────────────────────────────────────────────
export function Tabs({
  value,
  onChange,
  items,
}: {
  value: string
  onChange: (v: string) => void
  items: { value: string; label: string }[]
}) {
  return (
    <div className="tabs">
      {items.map((it) => (
        <button
          key={it.value}
          className="tab"
          data-active={value === it.value}
          onClick={() => onChange(it.value)}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

export function Segmented({
  value,
  onChange,
  items,
}: {
  value: string
  onChange: (v: string) => void
  items: { value: string; label: string; icon?: React.ReactNode }[]
}) {
  return (
    <div className="segmented">
      {items.map((it) => (
        <button
          key={it.value}
          className="seg"
          data-active={value === it.value}
          onClick={() => onChange(it.value)}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  desc?: string
  size?: 'lg' | 'xl'
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Modal({ open, onClose, title, desc, size, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        data-size={size}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {(title || desc) && (
          <div className="modal-header">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div>
                {title && <div className="h2">{title}</div>}
                {desc && (
                  <div className="muted text-sm" style={{ marginTop: 4 }}>
                    {desc}
                  </div>
                )}
              </div>
              <button className="icon-btn" onClick={onClose}>
                <I.x />
              </button>
            </div>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

// ── Sheet ─────────────────────────────────────────────────────────────────────
interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  size?: 'lg'
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Sheet({ open, onClose, title, subtitle, size, children, footer }: SheetProps) {
  if (!open) return null
  return (
    <div
      className="sheet-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="sheet"
        data-size={size}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sheet-header">
          <div>
            {title && <div className="h2">{title}</div>}
            {subtitle && (
              <div className="muted text-sm" style={{ marginTop: 4 }}>
                {subtitle}
              </div>
            )}
          </div>
          <button className="icon-btn" onClick={onClose}>
            <I.x />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </div>
  )
}

// ── DropdownMenu ──────────────────────────────────────────────────────────────
export interface DropdownItem {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  tone?: 'danger'
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: (DropdownItem | 'sep')[]
  align?: 'right' | 'left'
}

export function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const style: React.CSSProperties = {
    top: '100%',
    marginTop: 4,
    ...(align === 'right' ? { right: 0 } : { left: 0 }),
  }

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <span onClick={() => setOpen(!open)}>{trigger}</span>
      {open && (
        <div className="menu" style={style}>
          {items.map((it, i) =>
            it === 'sep' ? (
              <div key={i} className="menu-sep" />
            ) : (
              <div
                key={i}
                className="menu-item"
                data-tone={it.tone}
                onClick={() => {
                  it.onClick?.()
                  setOpen(false)
                }}
              >
                {it.icon}
                {it.label}
              </div>
            ),
          )}
        </div>
      )}
    </span>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
interface ToastData {
  id: string
  title: string
  desc?: string
  tone?: 'success' | 'error' | 'info'
  duration?: number
}

interface ToastContextValue {
  push: (t: Omit<ToastData, 'id'>) => void
}

const ToastCtx = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const push = useCallback((t: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((s) => [...s, { id, ...t }])
    setTimeout(
      () => setToasts((s) => s.filter((x) => x.id !== id)),
      t.duration ?? 4000,
    )
  }, [])

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className="toast" data-tone={t.tone}>
            {t.tone === 'success' ? (
              <I.check2 />
            ) : t.tone === 'error' ? (
              <I.alert />
            ) : (
              <I.info />
            )}
            <div style={{ flex: 1 }}>
              <div className="title">{t.title}</div>
              {t.desc && <div className="desc">{t.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// ── Progress ──────────────────────────────────────────────────────────────────
export function Progress({
  value = 0,
  tone,
  size = 'md',
}: {
  value?: number
  tone?: 'success' | 'danger'
  size?: 'sm' | 'md'
}) {
  return (
    <div
      className="progress"
      data-tone={tone}
      style={size === 'sm' ? { height: 4 } : {}}
    >
      <div style={{ width: `${value}%` }} />
    </div>
  )
}

// ── OtpInput ──────────────────────────────────────────────────────────────────
export function OtpInput({
  value,
  onChange,
  length = 6,
}: {
  value: string
  onChange: (v: string) => void
  length?: number
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/[^0-9]/g, '').slice(0, 1)
    const arr = (value || '').split('')
    arr[i] = digit
    const next = arr.join('').padEnd(length, '').replace(/\s+$/, '')
    onChange(next)
    if (digit && i < length - 1) refs.current[i + 1]?.focus()
  }

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus()
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const txt = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length)
    if (txt) {
      e.preventDefault()
      onChange(txt)
      refs.current[Math.min(txt.length, length - 1)]?.focus()
    }
  }

  return (
    <div className="otp-grid" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          className="otp-input"
          inputMode="numeric"
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          maxLength={1}
        />
      ))}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({
  w = '100%',
  h = 14,
  r = 4,
}: {
  w?: string | number
  h?: number
  r?: number
}) {
  return <div className="skel" style={{ width: w, height: h, borderRadius: r }} />
}

// ── Empty ─────────────────────────────────────────────────────────────────────
export function Empty({
  icon,
  title,
  desc,
  action,
}: {
  icon?: React.ReactNode
  title: string
  desc?: string
  action?: React.ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon || <I.fileSheet />}</div>
      <div className="empty-title">{title}</div>
      {desc && <div className="empty-desc">{desc}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

// ── ConfirmDialog ──────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean
  title: string
  desc?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  desc,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} desc={desc}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {/* content slot kept empty — title + desc carry the message */}
      <span />
    </Modal>
  )
}
