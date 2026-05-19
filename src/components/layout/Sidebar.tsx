import { useNavigate } from 'react-router-dom'
import { I } from '../icons'
import { useAuth } from '../../context/auth'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: string
}

interface SidebarProps {
  active: string
  onNav: (route: string) => void
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  trial: { daysLeft: number }
}

const mainItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <I.home /> },
  { id: 'partners', label: 'Parceiros', icon: <I.partners />, badge: '' },
  { id: 'map', label: 'Mapa', icon: <I.map /> },
  { id: 'public-map', label: 'Mapa Público', icon: <I.globe /> },
]

const dataItems: NavItem[] = [
  { id: 'import', label: 'Importar', icon: <I.upload /> },
  { id: 'export', label: 'Exportar', icon: <I.download /> },
  { id: 'integrations', label: 'Integrações', icon: <I.code /> },
  { id: 'geocoding-logs', label: 'Logs de Geocoding', icon: <I.pin /> },
]

const adminItems: NavItem[] = [
  { id: 'pin-types', label: 'Tipos de pin', icon: <I.pin /> },
  { id: 'team', label: 'Equipe', icon: <I.users /> },
  { id: 'billing', label: 'Faturamento', icon: <I.card /> },
  { id: 'settings', label: 'Configurações', icon: <I.settings /> },
]

const employeeItems: NavItem[] = [
  { id: 'pin-types', label: 'Tipos de pin', icon: <I.pin /> },
]

const supportItems: NavItem[] = [
  { id: 'support', label: 'Suporte', icon: <I.ticket /> },
]

function NavGroup({
  label,
  items,
  active,
  onNav,
}: {
  label: string
  items: NavItem[]
  active: string
  onNav: (id: string) => void
}) {
  return (
    <>
      <div className="sidebar-section-label">{label}</div>
      {items.map((it) => (
        <a
          key={it.id}
          className="nav-item"
          data-active={active === it.id}
          onClick={() => onNav(it.id)}
          title={it.label}
        >
          {it.icon}
          <span className="nav-item-label">{it.label}</span>
          {it.badge && <span className="nav-badge">{it.badge}</span>}
        </a>
      ))}
    </>
  )
}

export default function Sidebar({
  active,
  onNav,
  collapsed: _collapsed,
  mobileOpen,
  onCloseMobile,
  trial,
}: SidebarProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleNav = (route: string) => {
    navigate(`/${route}`)
    onNav(route)
    onCloseMobile()
  }

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'AC'

  return (
    <>
      {mobileOpen && <div className="mobile-overlay" onClick={onCloseMobile} />}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-mark">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" />
              <circle cx="12" cy="9" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <div className="sidebar-wordmark">
            MappaHub<span className="dot">.</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavGroup label="Visão geral" items={mainItems} active={active} onNav={handleNav} />
          <NavGroup label="Dados" items={dataItems} active={active} onNav={handleNav} />
          {user?.role === 'employee'
            ? <NavGroup label="Workspace" items={employeeItems} active={active} onNav={handleNav} />
            : <NavGroup label="Workspace" items={adminItems} active={active} onNav={handleNav} />
          }
          <NavGroup label="Ajuda" items={supportItems} active={active} onNav={handleNav} />
          {user?.role === 'super_admin' && (
            <>
              <div className="sidebar-section-label">Plataforma</div>
              <a
                className="nav-item"
                data-active={active === 'admin'}
                onClick={() => handleNav('admin')}
              >
                <I.shield />
                <span className="nav-item-label">Super Admin</span>
              </a>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {trial.daysLeft > 0 && user?.role !== 'employee' && (
            <div className="sidebar-trial">
              <div className="sidebar-trial-title">
                <span className="dot-warn" />
                Trial ativo
              </div>
              <div className="sidebar-trial-meta">{trial.daysLeft} dias restantes</div>
              <div className="sidebar-trial-bar">
                <div style={{ width: `${((14 - trial.daysLeft) / 14) * 100}%` }} />
              </div>
              <a className="sidebar-trial-cta" onClick={() => handleNav('billing')}>
                Assinar agora →
              </a>
            </div>
          )}
          <div className="sidebar-tenant" onClick={() => handleNav('settings')}>
            <div className="tenant-avatar">{initials}</div>
            <div className="sidebar-tenant-text">
              <div className="name">{user?.name ?? 'Usuário'}</div>
              <div className="role">{({ owner: 'Proprietário', admin: 'Administrador', employee: 'Colaborador', super_admin: 'Super Admin' } as Record<string, string>)[user?.role ?? ''] ?? user?.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
