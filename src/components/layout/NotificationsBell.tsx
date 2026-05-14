import { useRef, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { I } from '../icons'

type Notif = {
  id: string
  type: 'import_done' | 'import_failed' | 'geocoding_failures' | 'trial_expiring' | 'ticket_reply' | 'new_ticket'
  title: string
  desc: string
  createdAt: string
}

const STORAGE_KEY = 'notif_last_seen'

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 86400 * 2) return 'ontem'
  return `há ${Math.floor(diff / 86400)} dias`
}

function notifIcon(type: Notif['type']) {
  if (type === 'import_done') return <I.check size={14} style={{ color: 'var(--success)' }} />
  if (type === 'import_failed') return <I.alert size={14} style={{ color: 'var(--danger)' }} />
  if (type === 'geocoding_failures') return <I.pin size={14} style={{ color: 'var(--warning)' }} />
  if (type === 'trial_expiring') return <I.zap size={14} style={{ color: 'var(--warning)' }} />
  if (type === 'ticket_reply' || type === 'new_ticket') return <I.ticket size={14} style={{ color: 'var(--accent)' }} />
  return <I.bell size={14} />
}

function notifBg(type: Notif['type']) {
  if (type === 'import_done') return 'var(--success-soft, color-mix(in srgb, var(--success) 12%, transparent))'
  if (type === 'import_failed') return 'color-mix(in srgb, var(--danger) 12%, transparent)'
  if (type === 'ticket_reply' || type === 'new_ticket') return 'color-mix(in srgb, var(--accent) 12%, transparent)'
  return 'var(--bg-subtle)'
}

function notifColor(type: Notif['type']) {
  if (type === 'import_done') return 'var(--success)'
  if (type === 'import_failed') return 'var(--danger)'
  if (type === 'geocoding_failures') return 'var(--warning)'
  if (type === 'trial_expiring') return 'var(--warning)'
  if (type === 'ticket_reply' || type === 'new_ticket') return 'var(--accent)'
  return 'var(--fg-muted)'
}

export default function NotificationsBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [lastSeen, setLastSeen] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? '')
  const ref = useRef<HTMLDivElement>(null)

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })

  const unread = notifications.filter(n =>
    !lastSeen || new Date(n.createdAt).getTime() > new Date(lastSeen).getTime()
  ).length

  const markAllRead = () => {
    const now = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, now)
    setLastSeen(now)
  }

  const handleOpen = () => {
    setOpen(v => {
      if (!v && unread > 0) {
        const now = new Date().toISOString()
        localStorage.setItem(STORAGE_KEY, now)
        setLastSeen(now)
      }
      return !v
    })
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleAction = (n: Notif) => {
    setOpen(false)
    if (n.type === 'import_done' || n.type === 'import_failed') navigate('/import')
    else if (n.type === 'geocoding_failures') navigate('/geocoding-logs')
    else if (n.type === 'trial_expiring') navigate('/billing')
    else if (n.type === 'ticket_reply' || n.type === 'new_ticket') navigate('/support')
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="icon-btn"
        title="Notificações"
        onClick={handleOpen}
        style={{ position: 'relative' }}
      >
        <I.bell size={16} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--danger)',
            border: '2px solid var(--bg)',
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'fixed', top: 64, right: 12,
          width: 'min(360px, calc(100vw - 24px))', maxHeight: 480, overflowY: 'auto',
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 'var(--z-modal)' as never,
          animation: 'slideUp .15s ease',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 10px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Notificações</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {unread > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  background: 'var(--danger)', color: '#fff',
                  borderRadius: 999, padding: '1px 7px',
                }}>
                  {unread} nova{unread > 1 ? 's' : ''}
                </span>
              )}
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    fontSize: 12, color: 'var(--accent)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  Marcar como lidas
                </button>
              )}
            </div>
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <I.bell size={28} style={{ color: 'var(--fg-muted)', marginBottom: 8 }} />
              <div className="muted text-sm">Nenhuma notificação</div>
            </div>
          ) : (
            <div>
              {notifications.map(n => {
                const isNew = !lastSeen || new Date(n.createdAt).getTime() > new Date(lastSeen).getTime()
                return (
                  <div
                    key={n.id}
                    onClick={() => handleAction(n)}
                    style={{
                      display: 'flex', gap: 12, padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: isNew ? 'color-mix(in srgb, var(--accent) 4%, transparent)' : 'transparent',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                    onMouseLeave={e => (e.currentTarget.style.background = isNew ? 'color-mix(in srgb, var(--accent) 4%, transparent)' : 'transparent')}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: notifBg(n.type),
                      color: notifColor(n.type),
                      display: 'grid', placeItems: 'center',
                    }}>
                      {notifIcon(n.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: isNew ? 600 : 500, color: 'var(--fg)' }}>
                          {n.title}
                        </span>
                        {isNew && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 4 }} />
                        )}
                      </div>
                      <div className="muted text-sm" style={{ marginTop: 2, lineHeight: 1.4 }}>{n.desc}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 4 }}>{relativeTime(n.createdAt)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
