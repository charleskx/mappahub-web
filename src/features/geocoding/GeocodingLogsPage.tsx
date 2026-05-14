import axios from 'axios'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, Button, Input, Skeleton, useToast } from '../../components/ui'
import { I } from '../../components/icons'
import type { GeocodingLog } from '../../types'


function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 86400 * 7) return `há ${Math.floor(diff / 86400)} dias`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABEL: Record<string, string> = {
  no_results: 'Sem resultado',
  failed: 'Erro',
  success: 'Sucesso',
}
const STATUS_TONE: Record<string, 'danger' | 'warning' | 'success'> = {
  no_results: 'warning',
  failed: 'danger',
  success: 'success',
}

type GeoPreview = { lat: number; lng: number; city?: string; state?: string }

function LogRow({ log }: { log: GeocodingLog }) {
  const [expanded, setExpanded] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [preview, setPreview] = useState<GeoPreview | null>(null)
  const [validating, setValidating] = useState(false)
  const [applying, setApplying] = useState(false)
  const [fieldError, setFieldError] = useState('')
  const { push } = useToast()
  const qc = useQueryClient()

  const handleValidate = async () => {
    if (!newAddress.trim()) return
    setFieldError('')
    setPreview(null)
    setValidating(true)
    try {
      const result = await api.geocodingLogs.validateAddress(log.partnerId, newAddress)
      setPreview(result)
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Endereço não encontrado')
        : 'Endereço não encontrado'
      setFieldError(msg)
    } finally {
      setValidating(false)
    }
  }

  const handleApply = async () => {
    if (!preview) return
    setApplying(true)
    try {
      await api.geocodingLogs.applyAddress(log.partnerId, newAddress)
      push({ title: 'Endereço atualizado', desc: `${log.partnerName} foi geocodificado com sucesso.`, tone: 'success' })
      qc.invalidateQueries({ queryKey: ['geocoding-logs'] })
      qc.invalidateQueries({ queryKey: ['geocodingLogs'] })
    } catch {
      push({ title: 'Erro ao aplicar endereço', tone: 'error' })
    } finally {
      setApplying(false)
    }
  }

  return (
    <div style={{
      background: 'var(--bg-elev)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 16px', cursor: 'pointer',
        }}
        onClick={() => setExpanded(v => !v)}
      >
        {/* Status icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          display: 'grid', placeItems: 'center',
          background: log.status === 'failed'
            ? 'color-mix(in srgb, var(--danger) 12%, transparent)'
            : 'color-mix(in srgb, var(--warning) 12%, transparent)',
        }}>
          {log.status === 'failed'
            ? <I.alert size={16} style={{ color: 'var(--danger)' }} />
            : <I.pin size={16} style={{ color: 'var(--warning)' }} />}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg)' }}>
              {log.partnerName ?? 'Parceiro'}
            </span>
            <Badge tone={STATUS_TONE[log.status]}>{STATUS_LABEL[log.status]}</Badge>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {log.address}
          </div>
        </div>

        {/* Time + expand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{relTime(log.attemptedAt)}</span>
          <I.chevronRight size={14} style={{
            color: 'var(--fg-muted)',
            transform: expanded ? 'rotate(90deg)' : 'none',
            transition: 'transform .15s',
          }} />
        </div>
      </div>

      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 16px',
          background: 'var(--bg-subtle)',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {/* Sem log detalhado — falha anterior ao sistema de logs */}
          {!log.hasLog && (
            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
            }}>
              <I.alert size={14} style={{ color: 'var(--fg-muted)', marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Nenhum log detalhado disponível. Esta falha ocorreu antes do sistema de registro ser ativado.
                O erro será registrado automaticamente na próxima tentativa de geocodificação.
              </span>
            </div>
          )}

          {/* Error reason (quando há log) */}
          {log.hasLog && log.errorReason && (
            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '10px 14px', borderRadius: 8,
              background: log.status === 'failed'
                ? 'color-mix(in srgb, var(--danger) 8%, transparent)'
                : 'color-mix(in srgb, var(--warning) 8%, transparent)',
              border: `1px solid ${log.status === 'failed' ? 'color-mix(in srgb, var(--danger) 25%, transparent)' : 'color-mix(in srgb, var(--warning) 25%, transparent)'}`,
            }}>
              <I.alert size={14} style={{ color: log.status === 'failed' ? 'var(--danger)' : 'var(--warning)', marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.5 }}>{log.errorReason}</span>
            </div>
          )}

          {/* Details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Detail label="Endereço" value={log.address} />
            <Detail label={log.hasLog ? 'Última tentativa' : 'Última atualização'} value={new Date(log.attemptedAt).toLocaleString('pt-BR')} />
            {log.hasLog && <Detail label="Provedor" value={log.provider} />}
            <Detail label="Status geocoding" value={log.geocodeStatus ?? '—'} />
          </div>

          {/* Fix address */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Corrigir endereço
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Input
                  placeholder="Digite o endereço, CEP ou ponto de referência…"
                  value={newAddress}
                  onChange={e => { setNewAddress(e.target.value); setPreview(null); setFieldError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleValidate()}
                />
                {fieldError && (
                  <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{fieldError}</div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleValidate} disabled={validating || !newAddress.trim()}>
                {validating ? 'Validando…' : 'Validar'}
              </Button>
            </div>

            {preview && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '10px 14px', borderRadius: 8,
                background: 'color-mix(in srgb, var(--success) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)',
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <I.check size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>Endereço localizado</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
                      {[preview.city, preview.state].filter(Boolean).join(', ')} · {preview.lat.toFixed(5)}, {preview.lng.toFixed(5)}
                    </div>
                  </div>
                </div>
                <Button variant="primary" size="sm" onClick={handleApply} disabled={applying}>
                  {applying ? 'Aplicando…' : 'Confirmar'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--fg)' }}>{value}</div>
    </div>
  )
}

export default function GeocodingLogsPage() {
  const [search, setSearch] = useState('')

  const { data: logs = [], isLoading } = useQuery<GeocodingLog[]>({
    queryKey: ['geocoding-logs'],
    queryFn: () => api.geocodingLogs.list(),
    refetchInterval: 60_000,
  })

  const filtered = logs.filter(l =>
    !search ||
    l.partnerName?.toLowerCase().includes(search.toLowerCase()) ||
    l.address.toLowerCase().includes(search.toLowerCase()),
  )

  const byStatus = {
    failed: filtered.filter(l => l.status === 'failed').length,
    no_results: filtered.filter(l => l.status === 'no_results').length,
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="h1">Logs de Geocodificação</h1>
          <div className="muted text-sm">
            {logs.length === 0
              ? 'Nenhuma falha registrada'
              : `${logs.length} falha${logs.length !== 1 ? 's' : ''} registrada${logs.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      {/* Stats */}
      {logs.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <StatCard icon={<I.alert size={18} />} label="Erros" value={byStatus.failed} color="var(--danger)" />
          <StatCard icon={<I.pin size={18} />} label="Sem resultado" value={byStatus.no_results} color="var(--warning)" />
          <StatCard icon={<I.partners size={18} />} label="Parceiros afetados" value={new Set(filtered.map(l => l.partnerId)).size} color="var(--fg-muted)" />
        </div>
      )}

      {/* Search */}
      {logs.length > 0 && (
        <div className="table-toolbar" style={{ marginBottom: 16 }}>
          <div className="input-with-icon" style={{ maxWidth: 360 }}>
            <I.search size={14} />
            <input
              className="input"
              placeholder="Buscar por parceiro ou endereço…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} h={60} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--bg-subtle)', display: 'grid', placeItems: 'center' }}>
            <I.pin size={28} style={{ color: 'var(--fg-muted)' }} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>
            {logs.length === 0 ? 'Nenhuma falha de geocodificação' : 'Nenhum resultado para a busca'}
          </div>
          <div className="muted text-sm" style={{ textAlign: 'center', maxWidth: 360 }}>
            {logs.length === 0
              ? 'Quando um endereço não puder ser geocodificado, os detalhes aparecerão aqui.'
              : 'Tente buscar por outro termo.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(log => <LogRow key={log.id} log={log} />)}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 18px', borderRadius: 10,
      background: 'var(--bg-elev)', border: '1px solid var(--border)',
      minWidth: 140,
    }}>
      <div style={{ color, opacity: 0.8 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}
