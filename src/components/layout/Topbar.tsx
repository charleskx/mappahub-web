import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { I } from '../icons'
import { DropdownMenu } from '../ui'

interface TopbarProps {
  onToggleSidebar: () => void
  onOpenMobile: () => void
  breadcrumbs: string[]
  onCommand: () => void
}

export default function Topbar({
  onToggleSidebar,
  onOpenMobile,
  breadcrumbs,
  onCommand,
}: TopbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'AC'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn hide-sm" onClick={onToggleSidebar} title="Recolher menu">
          <I.panelLeft />
        </button>
        <button
          className="icon-btn"
          onClick={onOpenMobile}
          style={{ display: 'none' }}
          id="mobile-menu-btn"
        >
          <I.menu />
        </button>
        <nav className="topbar-trail">
          {breadcrumbs.map((crumb, i) => (
            <span key={i}>
              {i > 0 && <span className="sep">/</span>}
              <span className={i === breadcrumbs.length - 1 ? 'crumb-active' : ''}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="topbar-right">
        <button className="command-trigger" onClick={onCommand}>
          <I.search />
          <span className="placeholder">Buscar ou ir para...</span>
          <span className="kbd">⌘K</span>
        </button>
        <button className="icon-btn" title="Notificações">
          <I.bell />
        </button>
        <DropdownMenu
          trigger={
            <button
              className="icon-btn"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--bg-elev)',
                border: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600 }}>{initials}</span>
            </button>
          }
          items={[
            { label: 'Perfil', icon: <I.user />, onClick: () => navigate('/settings') },
            {
              label: 'Segurança / 2FA',
              icon: <I.shield />,
              onClick: () => navigate('/settings?tab=security'),
            },
            {
              label: 'Configurações',
              icon: <I.settings />,
              onClick: () => navigate('/settings'),
            },
            'sep',
            { label: 'Sair', icon: <I.logout />, tone: 'danger', onClick: handleLogout },
          ]}
        />
      </div>
    </header>
  )
}
