import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, Button, Card, CardHeader, Empty, Field, Input, Modal, useToast } from '../../components/ui'
import { I } from '../../components/icons'

export default function IntegrationsPage() {
  const qc = useQueryClient()
  const { push } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [mapName, setMapName] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { data: maps, isLoading } = useQuery({
    queryKey: ['maps'],
    queryFn: () => api.maps.list(),
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => api.maps.create(name),
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

  const copyEmbed = async (token: string, id: string) => {
    const base = window.location.origin
    const code = `<iframe src="${base}/public-map/${token}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`
    await navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const copyLink = async (token: string, id: string) => {
    const url = `${window.location.origin}/public-map/${token}`
    await navigator.clipboard.writeText(url)
    setCopiedId(id + '-link')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="h1">Integrações</h1>
          <p className="muted text-sm">Gere embeds públicos do seu mapa de parceiros</p>
        </div>
        <Button variant="primary" leftIcon={<I.plus size={14} />} onClick={() => setCreateOpen(true)}>
          Novo embed
        </Button>
      </div>

      {isLoading ? (
        <div className="muted">Carregando…</div>
      ) : !maps?.length ? (
        <Empty
          icon={<I.code size={28} />}
          title="Nenhum embed criado"
          desc="Crie um embed para compartilhar o mapa de parceiros publicamente"
          action={<Button variant="primary" onClick={() => setCreateOpen(true)}>Criar embed</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {maps.map((m) => (
            <Card key={m.id}>
              <CardHeader
                title={m.name}
                action={
                  <div style={{ display: 'flex', gap: 8 }}>
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
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{
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
                  }}
                >
                  {`<iframe src="${window.location.origin}/public-map/${m.token}" width="100%" height="500" frameborder="0"></iframe>`}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<I.copy size={12} />}
                    onClick={() => copyEmbed(m.token, m.id)}
                  >
                    {copiedId === m.id ? 'Copiado!' : 'Copiar embed'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<I.link size={12} />}
                    onClick={() => copyLink(m.token, m.id)}
                  >
                    {copiedId === m.id + '-link' ? 'Copiado!' : 'Copiar link'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
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
