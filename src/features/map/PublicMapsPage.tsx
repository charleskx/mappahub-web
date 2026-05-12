import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { Badge, Button, Card, CardHeader, ConfirmDialog, Empty, Field, Input, Modal, Skeleton, useToast } from '../../components/ui'
import { I } from '../../components/icons'
import { PublicMapPromo } from '../../components/PublicMapPromo'

export default function PublicMapsPage() {
  const qc = useQueryClient()
  const { push } = useToast()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [mapName, setMapName] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null)

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
  })

  const publicMapEnabled = settings ? (settings.publicMapEnabled ?? true) : true

  const { data: maps, isLoading } = useQuery({
    queryKey: ['maps'],
    queryFn: () => api.maps.list(),
  })

  const createMutation = useMutation({
    mutationFn: () => api.maps.create({ name: mapName, type: 'public' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maps'] })
      push({ title: 'Mapa criado', tone: 'success' })
      setCreateOpen(false)
      setMapName('')
    },
    onError: () => push({ title: 'Erro ao criar mapa', tone: 'error' }),
  })

  const tokenMutation = useMutation({
    mutationFn: (id: string) => api.maps.generateEmbedToken(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maps'] }),
    onError: () => push({ title: 'Erro ao gerar token', tone: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.maps.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maps'] })
      push({ title: 'Mapa removido', tone: 'success' })
    },
    onError: () => push({ title: 'Erro ao remover', tone: 'error' }),
  })

  const copyLink = async (token: string, id: string) => {
    const url = `${window.location.origin}/public-map/${token}`
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const openPreview = (token: string) => {
    window.open(`/public-map/${token}`, '_blank', 'noopener,noreferrer')
  }

  const handleNewMap = () => setCreateOpen(true)

  const showPromo = !publicMapEnabled && !maps?.length

  return (
    <div className="page" style={showPromo ? { display: 'flex', flexDirection: 'column' } : undefined}>
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="h1">Mapa público</h1>
          <div className="muted text-sm">Compartilhe seu mapa de parceiros externamente</div>
        </div>
        {!showPromo && (
          <div className="page-actions">
            <Button variant="primary" leftIcon={<I.plus size={14} />} disabled={!publicMapEnabled} onClick={handleNewMap}>
              Novo mapa
            </Button>
          </div>
        )}
      </div>

      {showPromo ? (
        <PublicMapPromo onEnable={() => navigate('/settings?tab=workspace')} />
      ) : (
        <>
          {!publicMapEnabled && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--warning-soft, #fef3c7)',
              border: '1px solid var(--warning-border, #fcd34d)',
              color: 'var(--warning-fg, #92400e)',
              fontSize: 13,
            }}>
              <I.alert size={15} style={{ flexShrink: 0 }} />
              <span>
                O mapa público está <strong>desabilitado</strong>. Links existentes ficam inacessíveis.{' '}
                <button
                  onClick={() => navigate('/settings?tab=workspace')}
                  style={{ color: 'inherit', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Habilitar nas configurações →
                </button>
              </span>
            </div>
          )}

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(3)].map((_, i) => <Skeleton key={i} h={100} />)}
            </div>
          ) : !maps?.length ? (
            <Empty
              icon={<I.globe size={28} />}
              title="Nenhum mapa público criado"
              desc="Crie um mapa para compartilhar seus parceiros publicamente"
              action={<Button variant="primary" disabled={!publicMapEnabled} onClick={handleNewMap}>Criar mapa</Button>}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {maps.map((m) => (
                <Card key={m.id}>
                  <CardHeader
                    title={m.name}
                    action={
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Badge tone={m.active ? 'success' : 'warning'} dot>
                          {m.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <button
                          className="icon-btn"
                          onClick={() => setConfirmTarget(m.id)}
                          title="Remover"
                          style={{ color: 'var(--danger)' }}
                        >
                          <I.trash size={14} />
                        </button>
                      </div>
                    }
                  />
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {m.embedToken ? (
                      <>
                        <div style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          padding: '8px 12px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: 'var(--fg-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {`${window.location.origin}/public-map/${m.embedToken}`}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<I.globe size={13} />}
                            onClick={() => openPreview(m.embedToken!)}
                          >
                            Visualizar mapa
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<I.link size={13} />}
                            onClick={() => copyLink(m.embedToken!, m.id)}
                          >
                            {copiedId === m.id ? 'Copiado!' : 'Copiar link'}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="muted text-sm">Link público ainda não gerado.</span>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<I.key size={13} />}
                          disabled={tokenMutation.isPending}
                          onClick={() => tokenMutation.mutate(m.id)}
                        >
                          Gerar link
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setMapName('') }}
        title="Novo mapa público"
        desc="Crie um mapa para compartilhar com clientes e parceiros"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!mapName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Criando…' : 'Criar mapa'}
            </Button>
          </div>
        }
      >
        <Field label="Nome do mapa">
          <Input
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            placeholder="Ex: Mapa de Distribuidores"
            autoFocus
          />
        </Field>
      </Modal>

      <ConfirmDialog
        open={!!confirmTarget}
        title="Remover mapa público?"
        desc="O link de compartilhamento deixará de funcionar."
        confirmLabel="Remover"
        onConfirm={() => {
          if (confirmTarget) deleteMutation.mutate(confirmTarget)
          setConfirmTarget(null)
        }}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}
