import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth'
import { Badge, Button, Input, Skeleton, Tabs } from '../../components/ui'
import { I } from '../../components/icons'
import { useNavigate } from 'react-router-dom'

function TenantsTab() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tenants', search],
    queryFn: () => api.superAdmin.tenants({ search: search || undefined }),
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input
        icon={<I.search size={14} />}
        placeholder="Buscar empresas…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 320 }}
      />

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} h={44} />)}
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Plano</th>
              <th>Parceiros</th>
              <th>Usuários</th>
              <th>Criado em</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((t) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 500 }}>{t.name}</td>
                <td>
                  <Badge tone={t.plan === 'trial' ? 'warning' : 'success'}>{t.plan}</Badge>
                </td>
                <td className="muted">{t.partnerCount ?? 0}</td>
                <td className="muted">{t.userCount ?? 0}</td>
                <td className="muted">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</td>
                <td>
                  <Badge tone={t.active ? 'success' : 'danger'} dot>
                    {t.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function UsersTab() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: () => api.superAdmin.users({ search: search || undefined }),
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input
        icon={<I.search size={14} />}
        placeholder="Buscar usuários…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 320 }}
      />

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} h={44} />)}
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Empresa</th>
              <th>Função</th>
              <th>2FA</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.name}</td>
                <td className="muted">{u.email}</td>
                <td className="muted">{u.tenantName ?? '—'}</td>
                <td><Badge>{u.role}</Badge></td>
                <td>
                  {u.twoFactorEnabled
                    ? <Badge tone="success">Ativo</Badge>
                    : <Badge>Inativo</Badge>
                  }
                </td>
                <td>
                  <Badge tone={u.emailVerified ? 'success' : 'warning'} dot>
                    {u.emailVerified ? 'Verificado' : 'Pendente'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function SuperAdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('tenants')

  if (user?.role !== 'super_admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <I.shield size={40} style={{ color: 'var(--danger)', marginBottom: 16 }} />
        <div className="h2">Acesso negado</div>
        <div className="muted text-sm" style={{ marginTop: 8 }}>Você não tem permissão para acessar esta área.</div>
        <Button variant="primary" style={{ marginTop: 16 }} onClick={() => navigate('/dashboard')}>
          Voltar ao Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: 'var(--amber)' }}><I.shield size={24} /></div>
        <div>
          <h1 className="h1">Super Admin</h1>
          <p className="muted text-sm">Painel de administração da plataforma</p>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'tenants', label: 'Empresas' },
          { value: 'users', label: 'Usuários' },
        ]}
      />

      {tab === 'tenants' && <TenantsTab />}
      {tab === 'users' && <UsersTab />}
    </div>
  )
}
