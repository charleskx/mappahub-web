import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { I } from '../icons'

interface CommandItem {
  id: string
  label: string
  icon: React.ReactNode
  kind: string
}

const ALL_ITEMS: CommandItem[] = [
  { id: 'dashboard', label: 'Ir para Dashboard', icon: <I.home />, kind: 'Navegação' },
  { id: 'partners', label: 'Ir para Parceiros', icon: <I.partners />, kind: 'Navegação' },
  { id: 'map', label: 'Abrir mapa interno', icon: <I.map />, kind: 'Navegação' },
  { id: 'import', label: 'Importar planilha', icon: <I.upload />, kind: 'Ação' },
  { id: 'export', label: 'Exportar dados', icon: <I.download />, kind: 'Ação' },
  { id: 'settings?tab=security', label: 'Configurar 2FA', icon: <I.shield />, kind: 'Segurança' },
  { id: 'integrations', label: 'Gerar embed', icon: <I.code />, kind: 'Ação' },
  { id: 'team', label: 'Convidar membro', icon: <I.users />, kind: 'Equipe' },
  { id: 'settings', label: 'Configurar Google Maps Key', icon: <I.key />, kind: 'Configuração' },
]

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) setQ('')
  }, [open])

  if (!open) return null

  const items = ALL_ITEMS.filter(
    (it) => !q || it.label.toLowerCase().includes(q.toLowerCase()),
  )

  const grouped = items.reduce<Record<string, CommandItem[]>>((acc, it) => {
    if (!acc[it.kind]) acc[it.kind] = []
    acc[it.kind].push(it)
    return acc
  }, {})

  const handleNav = (id: string) => {
    navigate(`/${id}`)
    onClose()
  }

  return (
    <div
      className="overlay"
      style={{ alignItems: 'flex-start', paddingTop: '15vh' }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal"
        style={{ maxWidth: 560, padding: 0 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <I.search />
          <input
            autoFocus
            className="input"
            style={{
              border: 0,
              padding: 0,
              height: 'auto',
              background: 'transparent',
              fontSize: 15,
            }}
            placeholder="O que você quer fazer?"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              padding: '2px 6px',
              background: 'var(--bg-subtle)',
              borderRadius: 4,
              border: '1px solid var(--border)',
            }}
          >
            esc
          </span>
        </div>

        <div style={{ maxHeight: 380, overflow: 'auto', padding: 6 }}>
          {Object.entries(grouped).map(([kind, list]) => (
            <div key={kind}>
              <div
                style={{
                  padding: '8px 10px 4px',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--fg-subtle)',
                }}
              >
                {kind}
              </div>
              {list.map((it) => (
                <div
                  key={it.id}
                  className="menu-item"
                  onClick={() => handleNav(it.id)}
                >
                  {it.icon}
                  <span style={{ flex: 1 }}>{it.label}</span>
                  <I.arrowRight size={12} style={{ color: 'var(--fg-subtle)' }} />
                </div>
              ))}
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center' }} className="muted">
              Nenhum resultado para "{q}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
