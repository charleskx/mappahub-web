import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { Badge, Button, Card, CardHeader, Empty, Field, Input, Modal, Segmented, useToast } from '../../components/ui'
import { I } from '../../components/icons'
import { PublicMapPromo } from '../../components/PublicMapPromo'

type EmbedType = 'iframe' | 'script'

function buildSnippet(token: string, type: EmbedType): string {
  const base = window.location.origin
  if (type === 'iframe') {
    return `<iframe src="${base}/public-map/${token}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`
  }
  return `<div id="atlasync-map"></div>\n<script src="${base}/sdk/embed.js"></script>\n<script>\n  MappaHubMap.init({ token: "${token}", container: "atlasync-map" })\n</script>`
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const qc = useQueryClient()
  const { push } = useToast()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [mapName, setMapName] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [embedTypes, setEmbedTypes] = useState<Record<string, EmbedType>>({})

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
  })

  // undefined = still loading (don't flash promo); false = explicitly disabled
  const publicMapEnabled = settings ? (settings.publicMapEnabled ?? true) : true

  const { data: maps, isLoading } = useQuery({
    queryKey: ['maps'],
    queryFn: () => api.maps.list(),
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => api.maps.create({ name, type: 'public' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maps'] })
      push({ title: 'Mapa criado', tone: 'success' })
      setCreateOpen(false)
      setMapName('')
    },
    onError: () => push({ title: 'Erro ao criar mapa', tone: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.maps.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maps'] })
      push({ title: 'Embed removido', tone: 'success' })
    },
    onError: () => push({ title: 'Erro ao remover', tone: 'error' }),
  })

  const getType = (id: string): EmbedType => embedTypes[id] ?? 'iframe'
  const setType = (id: string, type: EmbedType) => setEmbedTypes((prev) => ({ ...prev, [id]: type }))

  const copyEmbed = async (embedToken: string, id: string) => {
    await navigator.clipboard.writeText(buildSnippet(embedToken, getType(id)))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const copyLink = async (embedToken: string, id: string) => {
    const url = `${window.location.origin}/public-map/${embedToken}`
    await navigator.clipboard.writeText(url)
    setCopiedId(id + '-link')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleNewEmbed = () => setCreateOpen(true)

  // Feature off + no maps → full promo screen
  const showPromo = !publicMapEnabled && !maps?.length

  return (
    <div className="page" style={showPromo ? { display: 'flex', flexDirection: 'column' } : undefined}>
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="h1">Integrações</h1>
          <div className="muted text-sm">Gere embeds públicos do seu mapa de parceiros</div>
        </div>
        {!showPromo && (
          <div className="page-actions">
            <Button
              variant="primary"
              leftIcon={<I.plus size={14} />}
              disabled={!publicMapEnabled}
              onClick={handleNewEmbed}
            >
              Novo embed
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
            <div className="muted">Carregando…</div>
          ) : !maps?.length ? (
            <Empty
              icon={<I.code size={28} />}
              title="Nenhum embed criado"
              desc="Crie um embed para compartilhar o mapa de parceiros publicamente"
              action={<Button variant="primary" disabled={!publicMapEnabled} onClick={handleNewEmbed}>Criar embed</Button>}
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
                          onClick={() => deleteMutation.mutate(m.id)}
                          title="Remover"
                          style={{ color: 'var(--danger)' }}
                        >
                          <I.trash size={14} />
                        </button>
                      </div>
                    }
                  />
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {m.embedToken ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <Segmented
                            value={getType(m.id)}
                            onChange={(v) => setType(m.id, v as EmbedType)}
                            items={[
                              { value: 'iframe', label: 'iFrame' },
                              { value: 'script', label: 'Script' },
                            ]}
                          />
                        </div>
                        <div style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          padding: '10px 12px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: 'var(--fg-muted)',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          lineHeight: 1.6,
                        }}>
                          {buildSnippet(m.embedToken, getType(m.id))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<I.copy size={12} />}
                            onClick={() => copyEmbed(m.embedToken!, m.id)}
                          >
                            {copiedId === m.id ? 'Copiado!' : 'Copiar código'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<I.link size={12} />}
                            onClick={() => copyLink(m.embedToken!, m.id)}
                          >
                            {copiedId === m.id + '-link' ? 'Copiado!' : 'Copiar link'}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="muted text-sm">Token de embed não gerado</div>
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
        title="Novo embed"
        desc="Crie um link público para compartilhar seu mapa de parceiros"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!mapName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate(mapName.trim())}
            >
              {createMutation.isPending ? 'Criando…' : 'Criar embed'}
            </Button>
          </div>
        }
      >
        <Field label="Nome do embed" hint="Use um nome que identifique o mapa (ex: Site principal)">
          <Input
            placeholder="Mapa do site"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            autoFocus
          />
        </Field>
      </Modal>
    </div>
  )
}
