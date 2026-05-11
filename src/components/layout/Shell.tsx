import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import CommandPalette from './CommandPalette'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const BREADCRUMB_MAP: Record<string, string[]> = {
  '/dashboard': ['Workspace', 'Dashboard'],
  '/partners': ['Workspace', 'Parceiros'],
  '/map': ['Workspace', 'Mapa interno'],
  '/public-map': ['Workspace', 'Mapa público'],
  '/import': ['Dados', 'Importar'],
  '/export': ['Dados', 'Exportar'],
  '/integrations': ['Dados', 'Integrações'],
  '/pin-types': ['Workspace', 'Tipos de pin'],
  '/team': ['Workspace', 'Equipe'],
  '/billing': ['Workspace', 'Faturamento'],
  '/settings': ['Workspace', 'Configurações'],
  '/admin': ['Plataforma', 'Super Admin'],
}

export default function Shell({ children }: { children: React.ReactNode }) {
  useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)

  const path = location.pathname
  const breadcrumbs = BREADCRUMB_MAP[path] ?? [path.replace('/', '')]
  const active = path.replace('/', '')
  const isFlush = path === '/map'

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const trial = { daysLeft: 0 }

  return (
    <div
      className="app-shell"
      data-collapsed={collapsed}
      data-mobile-open={mobileOpen}
      data-fullscreen={isFlush}
    >
      <Sidebar
        active={active}
        onNav={() => {}}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        trial={trial}
      />
      <Topbar
        onToggleSidebar={() => setCollapsed((c) => !c)}
        onOpenMobile={() => setMobileOpen(true)}
        breadcrumbs={breadcrumbs}
        onCommand={() => setCmdOpen(true)}
      />
      <main className="main">
        {children}
      </main>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  )
}
