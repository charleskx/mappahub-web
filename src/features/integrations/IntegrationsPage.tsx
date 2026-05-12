import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { Badge, Button, Card, CardHeader, Empty, Field, Input, Modal, Segmented, useToast } from '../../components/ui'
import { I } from '../../components/icons'

type EmbedType = 'iframe' | 'script'

function buildSnippet(token: string, type: EmbedType): string {
  const base = window.location.origin
  if (type === 'iframe') {
    return `<iframe src="${base}/public-map/${token}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`
  }
  return `<div id="atlasync-map"></div>\n<script src="${base}/sdk/embed.js"></script>\n<script>\n  AtlaSyncMap.init({ token: "${token}", container: "atlasync-map" })\n</script>`
}

// ── Promo ─────────────────────────────────────────────────────────────────────
function PublicMapPromo({ onEnable }: { onEnable: () => void }) {
  return (
    <>
      <style>{`
        @keyframes pin-float-a {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pin-float-b {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @keyframes pin-float-c {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: 40,
        animation: 'fade-up .4s ease both',
      }}>

        {/* Illustration */}
        <div style={{ position: 'relative', width: 320, height: 200 }}>
          <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            {/* Card / browser window */}
            <rect x="10" y="10" width="300" height="180" rx="12" fill="var(--bg-elev)" stroke="var(--border)" strokeWidth="1.5"/>
            {/* Titlebar */}
            <rect x="10" y="10" width="300" height="32" rx="12" fill="var(--bg-subtle)"/>
            <rect x="10" y="30" width="300" height="12" fill="var(--bg-subtle)"/>
            <circle cx="30" cy="26" r="5" fill="var(--danger)" opacity=".5"/>
            <circle cx="46" cy="26" r="5" fill="#f59e0b" opacity=".5"/>
            <circle cx="62" cy="26" r="5" fill="var(--success)" opacity=".5"/>
            {/* URL bar */}
            <rect x="80" y="19" width="170" height="14" rx="4" fill="var(--bg)" stroke="var(--border)" strokeWidth="1"/>
            <text x="165" y="30" fontSize="8" fill="var(--fg-muted)" textAnchor="middle" fontFamily="monospace">atlasync.com/mapa</text>

            {/* Map grid lines */}
            <line x1="10" y1="80" x2="310" y2="80" stroke="var(--border)" strokeWidth=".5" opacity=".6"/>
            <line x1="10" y1="110" x2="310" y2="110" stroke="var(--border)" strokeWidth=".5" opacity=".6"/>
            <line x1="10" y1="140" x2="310" y2="140" stroke="var(--border)" strokeWidth=".5" opacity=".6"/>
            <line x1="10" y1="170" x2="310" y2="170" stroke="var(--border)" strokeWidth=".5" opacity=".6"/>
            <line x1="80" y1="42" x2="80" y2="190" stroke="var(--border)" strokeWidth=".5" opacity=".6"/>
            <line x1="150" y1="42" x2="150" y2="190" stroke="var(--border)" strokeWidth=".5" opacity=".6"/>
            <line x1="220" y1="42" x2="220" y2="190" stroke="var(--border)" strokeWidth=".5" opacity=".6"/>
            <line x1="290" y1="42" x2="290" y2="190" stroke="var(--border)" strokeWidth=".5" opacity=".6"/>

            {/* Pin A */}
            <g style={{ animation: 'pin-float-a 2.4s ease-in-out infinite', transformOrigin: '110px 130px' }}>
              <circle cx="110" cy="136" r="5" fill="#4f46e5" opacity=".2" style={{ animation: 'pulse-ring 2.4s ease-out infinite' }}/>
              <path d="M110 120 C107 120 104 123 104 127 C104 132 110 139 110 139 C110 139 116 132 116 127 C116 123 113 120 110 120Z" fill="#4f46e5"/>
              <circle cx="110" cy="127" r="2.5" fill="white"/>
            </g>

            {/* Pin B */}
            <g style={{ animation: 'pin-float-b 3s ease-in-out .6s infinite', transformOrigin: '190px 100px' }}>
              <circle cx="190" cy="106" r="5" fill="#10b981" opacity=".2" style={{ animation: 'pulse-ring 3s ease-out .6s infinite' }}/>
              <path d="M190 90 C187 90 184 93 184 97 C184 102 190 109 190 109 C190 109 196 102 196 97 C196 93 193 90 190 90Z" fill="#10b981"/>
              <circle cx="190" cy="97" r="2.5" fill="white"/>
            </g>

            {/* Pin C */}
            <g style={{ animation: 'pin-float-c 2.8s ease-in-out 1.2s infinite', transformOrigin: '255px 150px' }}>
              <circle cx="255" cy="156" r="5" fill="#f59e0b" opacity=".2" style={{ animation: 'pulse-ring 2.8s ease-out 1.2s infinite' }}/>
              <path d="M255 140 C252 140 249 143 249 147 C249 152 255 159 255 159 C255 159 261 152 261 147 C261 143 258 140 255 140Z" fill="#f59e0b"/>
              <circle cx="255" cy="147" r="2.5" fill="white"/>
            </g>

            {/* Embed badge */}
            <rect x="18" y="168" width="64" height="16" rx="4" fill="#4f46e5" opacity=".12"/>
            <text x="50" y="179" fontSize="7.5" fill="#4f46e5" textAnchor="middle" fontWeight="600">Powered by AtlaSync</text>
          </svg>
        </div>

        {/* Copy */}
        <div style={{ textAlign: 'center', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
            Compartilhe seu mapa de parceiros com o mundo
          </h2>
          <p className="muted" style={{ fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Gere embeds públicos e incorpore o mapa interativo em qualquer site —
            via <strong>iFrame</strong> ou <strong>SDK JavaScript</strong> — com filtros,
            clusters e geolocalização automática.
          </p>
        </div>

        {/* Feature chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {[
            { icon: <I.code size={14} />, label: 'iFrame & SDK', desc: 'Uma linha de código' },
            { icon: <I.map size={14} />,  label: 'Mapa interativo', desc: 'Filtros e clusters' },
            { icon: <I.lock size={14} />, label: 'Token seguro', desc: 'Acesso controlado' },
          ].map((f) => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-elev)',
              minWidth: 160,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--accent-subtle, #4f46e510)',
                color: 'var(--accent)',
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{f.label}</div>
                <div className="muted text-xs">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Button variant="primary" size="lg" leftIcon={<I.zap size={15} />} onClick={onEnable}>
            Habilitar mapa público
          </Button>
          <a
            href="https://atlasync.com"
            target="_blank"
            rel="noopener noreferrer"
            className="muted text-sm"
            style={{ color: 'var(--fg-muted)' }}
          >
            Saiba mais em atlasync.com →
          </a>
        </div>
      </div>
    </>
  )
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

  const handleNewEmbed = () => {
    if (!publicMapEnabled) {
      push({ title: 'Mapa público desabilitado', tone: 'error' })
      navigate('/settings?tab=workspace')
      return
    }
    setCreateOpen(true)
  }

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
              action={<Button variant="primary" onClick={handleNewEmbed}>Criar embed</Button>}
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
