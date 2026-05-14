import { useState } from 'react'
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth'
import { Badge, Button, Input, Modal, Skeleton, useToast } from '../../components/ui'
import { I } from '../../components/icons'
import { useNavigate } from 'react-router-dom'
import type { ImportJob } from '../../types'

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Mensal',
  annual: 'Anual',
  trial: 'Trial',
}

function formatBytes(bytes: number | null | undefined) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'done') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'processing') return 'info'
  return 'warning'
}

function TenantImportsModal({
  tenantId,
  tenantName,
  open,
  onClose,
}: {
  tenantId: string
  tenantName: string
  open: boolean
  onClose: () => void
}) {
  const { push } = useToast()
  const qc = useQueryClient()
  const [confirmJob, setConfirmJob] = useState<ImportJob | null>(null)

  const { data: imports, isLoading } = useQuery({
    queryKey: ['admin', 'imports', tenantId],
    queryFn: () => api.admin.tenantImports(tenantId),
    enabled: open,
  })

  const rollbackMutation = useMutation({
    mutationFn: (jobId: string) => api.admin.rollbackImport(tenantId, jobId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'imports', tenantId] })
      push({ title: 'Import revertido com sucesso', tone: 'success' })
      setConfirmJob(null)
    },
    onError: () => push({ title: 'Erro ao reverter import', tone: 'error' }),
  })

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="xl"
        title={`Histórico de imports — ${tenantName}`}
        desc="Últimos 10 imports desta empresa. Reverter restaura parceiros apagados e remove os criados pelo job. Atualizações não são desfeitas."
      >
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(4)].map((_, i) => <Skeleton key={i} h={72} />)}
          </div>
        ) : !imports?.length ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <I.fileSheet size={32} style={{ color: 'var(--fg-muted)', marginBottom: 10 }} />
            <div className="muted text-sm">Nenhuma importação encontrada.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {imports.map((job) => (
              <div
                key={job.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  alignItems: 'center',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  opacity: job.rolledBackAt ? 0.6 : 1,
                }}
              >
                {/* Left: file info + stats */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <I.fileSheet size={14} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.fileName ?? '—'}
                    </span>
                    <span className="muted text-sm" style={{ flexShrink: 0 }}>{formatBytes(job.fileSize)}</span>
                    <span style={{ marginLeft: 'auto', flexShrink: 0 }}>
                      {job.rolledBackAt
                        ? <Badge tone="warning">Revertido</Badge>
                        : <Badge tone={statusTone(job.status)}>{job.status}</Badge>
                      }
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span className="muted text-sm">Modo</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{job.mode === 'full' ? 'Substituição total' : 'Incremental'}</span>
                    </div>
                    <div style={{ width: 1, background: 'var(--border)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span className="muted text-sm">Criados</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--success)' }}>{job.created ?? 0}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span className="muted text-sm">Atualizados</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{job.updated ?? 0}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span className="muted text-sm">Removidos</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: job.removed ? 'var(--danger)' : undefined }}>{job.removed ?? 0}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span className="muted text-sm">Erros</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: job.failed ? 'var(--danger)' : undefined }}>{job.failed ?? 0}</span>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'right' }}>
                      <span className="muted text-sm">Data</span>
                      <span style={{ fontSize: 13 }}>{new Date(job.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Right: rollback button */}
                <div>
                  {job.status === 'done' && !job.rolledBackAt && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<I.undo size={12} />}
                      onClick={() => setConfirmJob(job)}
                      style={{ color: 'var(--danger)', borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)', whiteSpace: 'nowrap' }}
                    >
                      Reverter
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Rollback confirmation */}
      <Modal
        open={!!confirmJob}
        onClose={() => setConfirmJob(null)}
        title="Confirmar reversão do import"
        desc={`Arquivo: ${confirmJob?.fileName ?? '—'} · ${confirmJob?.mode === 'full' ? 'Substituição total' : 'Incremental'}`}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setConfirmJob(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={() => confirmJob && rollbackMutation.mutate(confirmJob.id)}
              disabled={rollbackMutation.isPending}
            >
              {rollbackMutation.isPending ? 'Revertendo…' : 'Sim, reverter'}
            </Button>
          </div>
        }
      >
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          background: 'color-mix(in srgb, var(--danger) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)',
          borderRadius: 8, padding: '10px 12px',
        }}>
          <I.alert size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
          <div className="text-sm" style={{ color: 'var(--danger)' }}>
            <strong>{confirmJob?.created ?? 0} parceiros criados</strong> serão removidos e{' '}
            <strong>{confirmJob?.removed ?? 0} parceiros apagados</strong> serão restaurados.
            Atualizações de registros existentes <strong>não</strong> serão desfeitas.
          </div>
        </div>
      </Modal>
    </>
  )
}

type TenantUser = { id: string; name: string; email: string; role: string; totpEnabled: boolean; createdAt: string }

function TenantUsersModal({
  tenantId,
  tenantName,
  open,
  onClose,
}: {
  tenantId: string
  tenantName: string
  open: boolean
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { push } = useToast()
  const [confirmUser, setConfirmUser] = useState<TenantUser | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'tenants', tenantId, 'users'],
    queryFn: () => api.admin.tenantUsers(tenantId),
    enabled: open,
  })

  const disable2faMutation = useMutation({
    mutationFn: (userId: string) => api.admin.disable2fa(tenantId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tenants', tenantId, 'users'] })
      push({ title: '2FA desativado com sucesso', tone: 'success' })
      setConfirmUser(null)
    },
    onError: () => push({ title: 'Erro ao desativar 2FA', tone: 'error' }),
  })

  const ROLE_LABELS: Record<string, string> = {
    owner: 'Proprietário',
    admin: 'Administrador',
    employee: 'Colaborador',
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={`Usuários — ${tenantName}`} size="lg">
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(3)].map((_, i) => <Skeleton key={i} h={44} />)}
          </div>
        ) : users.length === 0 ? (
          <div className="muted text-sm" style={{ textAlign: 'center', padding: 32 }}>Nenhum usuário encontrado</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Cargo</th>
                <th>2FA</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{u.name}</div>
                    <div className="muted text-sm">{u.email}</div>
                  </td>
                  <td><Badge>{ROLE_LABELS[u.role] ?? u.role}</Badge></td>
                  <td>
                    <Badge tone={u.totpEnabled ? 'success' : undefined} dot>
                      {u.totpEnabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td>
                    {u.totpEnabled && (
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 12, color: 'var(--danger)', padding: '3px 8px', height: 28 }}
                        onClick={() => setConfirmUser(u)}
                      >
                        Remover 2FA
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>

      <Modal
        open={!!confirmUser}
        onClose={() => setConfirmUser(null)}
        title="Remover autenticação de dois fatores"
      >
        <p style={{ margin: '0 0 16px', lineHeight: 1.6 }}>
          Tem certeza que deseja remover o 2FA de <strong>{confirmUser?.name}</strong>?
          O usuário precisará reconfigurar a autenticação de dois fatores caso queira reativá-la.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setConfirmUser(null)}>Cancelar</Button>
          <Button
            variant="danger"
            disabled={disable2faMutation.isPending}
            onClick={() => confirmUser && disable2faMutation.mutate(confirmUser.id)}
          >
            {disable2faMutation.isPending ? 'Removendo…' : 'Sim, remover 2FA'}
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default function SuperAdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { push } = useToast()
  const [activeTab] = useState<'tenants'>('tenants')
  const [search, setSearch] = useState('')
  const [importsModal, setImportsModal] = useState<{ id: string; name: string } | null>(null)
  const [usersModal, setUsersModal] = useState<{ id: string; name: string } | null>(null)

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: () => api.admin.tenants(),
    enabled: user?.role === 'super_admin',
  })

  const filtered = useMemo(() => {
    if (!tenants) return []
    if (!search) return tenants
    const q = search.toLowerCase()
    return tenants.filter((t) => t.name.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q))
  }, [tenants, search])

  const blockMutation = useMutation({
    mutationFn: (id: string) => api.admin.blockTenant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] })
      push({ title: 'Empresa bloqueada', tone: 'success' })
    },
    onError: () => push({ title: 'Erro ao bloquear', tone: 'error' }),
  })

  const unblockMutation = useMutation({
    mutationFn: (id: string) => api.admin.unblockTenant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] })
      push({ title: 'Empresa desbloqueada', tone: 'success' })
    },
    onError: () => push({ title: 'Erro ao desbloquear', tone: 'error' }),
  })

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
    <div className="page">
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="h1">Super Admin</h1>
          <div className="muted text-sm">{tenants?.length ?? 0} empresas na plataforma</div>
        </div>
      </div>

      {activeTab === 'tenants' && <>
      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          icon={<I.search size={14} />}
          placeholder="Buscar empresas…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
      </div>

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
              <th>Status assinatura</th>
              <th>Criado em</th>
              <th>Status</th>
              <th style={{ width: 100 }} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{t.name}</div>
                  {t.email && <div className="muted text-sm">{t.email}</div>}
                </td>
                <td>
                  <Badge>{PLAN_LABELS[t.planType ?? ''] ?? t.planType ?? '—'}</Badge>
                </td>
                <td>
                  <Badge
                    tone={
                      t.subscriptionStatus === 'active' ? 'success'
                        : t.subscriptionStatus === 'trialing' ? 'warning'
                          : 'danger'
                    }
                  >
                    {t.subscriptionStatus ?? '—'}
                  </Badge>
                </td>
                <td className="muted">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</td>
                <td>
                  <Badge tone={t.active ? 'success' : 'danger'} dot>
                    {t.active ? 'Ativo' : 'Bloqueado'}
                  </Badge>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button
                      className="icon-btn"
                      title="Usuários"
                      onClick={() => setUsersModal({ id: t.id, name: t.name })}
                    >
                      <I.users size={14} />
                    </button>
                    <button
                      className="icon-btn"
                      title="Ver imports"
                      onClick={() => setImportsModal({ id: t.id, name: t.name })}
                    >
                      <I.fileSheet size={14} />
                    </button>
                    {t.active ? (
                      <button
                        className="icon-btn"
                        title="Bloquear"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => blockMutation.mutate(t.id)}
                      >
                        <I.shield size={14} />
                      </button>
                    ) : (
                      <button
                        className="icon-btn"
                        title="Desbloquear"
                        onClick={() => unblockMutation.mutate(t.id)}
                      >
                        <I.check size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      </>}

      {importsModal && (
        <TenantImportsModal
          tenantId={importsModal.id}
          tenantName={importsModal.name}
          open={!!importsModal}
          onClose={() => setImportsModal(null)}
        />
      )}

      {usersModal && (
        <TenantUsersModal
          tenantId={usersModal.id}
          tenantName={usersModal.name}
          open={!!usersModal}
          onClose={() => setUsersModal(null)}
        />
      )}
    </div>
  )
}
