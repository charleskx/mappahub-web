import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth'
import { Button, Card, CardHeader, Segmented, Skeleton } from '../../components/ui'
import { I } from '../../components/icons'
import { useState } from 'react'

// ── Helpers ───────────────────────────────────────────────────────────────────
function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 86400 * 2) return 'ontem'
  return `há ${Math.floor(diff / 86400)} dias`
}

function delta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? { label: `+${current}`, trend: 'up' as const } : null
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return { label: '0%', trend: 'neutral' as const }
  return { label: `${pct > 0 ? '+' : ''}${pct}%`, trend: pct > 0 ? ('up' as const) : ('down' as const) }
}

function statusLabel(status: string) {
  if (status === 'done') return { text: 'Concluído', color: 'var(--success)' }
  if (status === 'failed') return { text: 'Falhou', color: 'var(--danger)' }
  if (status === 'processing') return { text: 'Processando', color: 'var(--warning)' }
  return { text: 'Na fila', color: 'var(--fg-muted)' }
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Spark({ values }: { values: number[] }) {
  if (!values.length) return <div className="spark" />
  const max = Math.max(...values, 1)
  return (
    <div className="spark">
      {values.map((v, i) => (
        <span key={i} className={v === max ? 'peak' : ''} style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  )
}

// ── GeoRow ────────────────────────────────────────────────────────────────────
function GeoRow({ label, count, max }: { label: string; count: number; max: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12, padding: '7px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="mono text-xs" style={{ color: 'var(--fg-muted)', width: 80, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ flex: 1, height: 7, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden', minWidth: 60 }}>
          <div style={{ height: '100%', width: `${max > 0 ? (count / max) * 100 : 0}%`, background: 'linear-gradient(90deg, var(--accent), oklch(from var(--accent) calc(l - 0.1) c h))', borderRadius: 4 }} />
        </div>
      </div>
      <div className="mono text-xs" style={{ textAlign: 'right' }}>{count.toLocaleString('pt-BR')}</div>
    </div>
  )
}

// ── PinTypeRow ────────────────────────────────────────────────────────────────
function PinTypeRow({ name, color, count, max }: { name: string; color: string; count: number; max: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12, padding: '7px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
        <div style={{ fontSize: 13, color: 'var(--fg)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ flex: 2, height: 7, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden', minWidth: 60 }}>
          <div style={{ height: '100%', width: `${max > 0 ? (count / max) * 100 : 0}%`, background: color, borderRadius: 4, opacity: 0.8 }} />
        </div>
      </div>
      <div className="mono text-xs" style={{ textAlign: 'right' }}>{count.toLocaleString('pt-BR')}</div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] ?? 'visitante'
  const [geoTab, setGeoTab] = useState('estado')

  // Poll importJobs to detect active imports
  const { data: importJobs } = useQuery({
    queryKey: ['importJobs'],
    queryFn: () => api.import.list(),
    refetchInterval: 5000,
  })
  const hasActiveImport = importJobs?.some(j => j.status === 'queued' || j.status === 'processing') ?? false

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.dashboard.stats(),
    staleTime: 60_000,
    refetchInterval: hasActiveImport ? 3000 : false,
  })

  // Sparkline: last 6 months of partner creation
  const spark = data?.partnersByMonth.map((m) => m.count) ?? []
  // Pad to 6 bars for visual consistency
  const sparkPadded = spark.length >= 2 ? spark : [...Array(Math.max(0, 2 - spark.length)).fill(0), ...spark]

  const partnerDelta = data ? delta(data.partners.thisMonth, data.partners.lastMonth) : null
  const importDelta = data ? delta(data.imports.thisMonth, data.imports.lastMonth) : null

  const geoList =
    geoTab === 'estado'
      ? data?.geo.byState.map((r) => ({ label: r.state, count: r.count })) ?? []
      : geoTab === 'cidade'
      ? data?.geo.byCity.map((r) => ({ label: r.city, count: r.count })) ?? []
      : []
  const geoMax = Math.max(...geoList.map((r) => r.count), 1)

  const pinTypeMax = Math.max(...(data?.geo.byPinType.map((r) => r.count) ?? []), 1)

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-block">
          <div className="eyebrow">Visão geral</div>
          <h1 className="h1">Bom dia, {firstName}</h1>
        </div>
        <div className="page-actions">
          <Button variant="outline" leftIcon={<I.download />} onClick={() => navigate('/export')}>
            Exportar
          </Button>
          <Button variant="primary" leftIcon={<I.upload />} onClick={() => navigate('/import')}>
            Importar planilha
          </Button>
        </div>
      </div>

      {/* Stat grid */}
      <div className="stat-grid">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat">
                <Skeleton h={14} w="60%" />
                <Skeleton h={32} w="40%" r={6} />
                <Skeleton h={12} w="50%" />
                <Skeleton h={36} />
              </div>
            ))
          : [
              {
                label: 'Parceiros ativos',
                icon: <I.partners />,
                value: (data?.partners.total ?? 0).toLocaleString('pt-BR'),
                d: partnerDelta,
                sparkValues: sparkPadded,
              },
              {
                label: 'Geocoding ok',
                icon: <I.pin />,
                value: `${data?.partners.geocodedPct ?? 0}%`,
                d: null as typeof partnerDelta,
                extra: data ? `${data.partners.geocodedDone.toLocaleString('pt-BR')} endereços` : null,
                sparkValues: data
                  ? [data.partners.geocodedDone, data.partners.total - data.partners.geocodedDone].filter(Boolean)
                  : [],
              },
              {
                label: 'Imports este mês',
                icon: <I.upload />,
                value: (data?.imports.thisMonth ?? 0).toLocaleString('pt-BR'),
                d: importDelta,
                extra: data ? `${data.imports.total.toLocaleString('pt-BR')} no total` : null,
                sparkValues: sparkPadded,
              },
              {
                label: 'Parceiros públicos',
                icon: <I.eye />,
                value: (data?.partners.public ?? 0).toLocaleString('pt-BR'),
                d: null as typeof partnerDelta,
                extra: data ? `${data.partners.internal.toLocaleString('pt-BR')} internos` : null,
                sparkValues: data ? [data.partners.public, data.partners.internal] : [],
              },
            ].map((s, i) => (
              <div key={i} className="stat">
                <div className="stat-label">{s.icon}{s.label}</div>
                <div className="stat-value">{s.value}</div>
                {s.d ? (
                  <div className="stat-delta" data-trend={s.d.trend}>
                    {s.d.trend === 'up' ? <I.arrowUp /> : s.d.trend === 'down' ? <I.arrowDown /> : null}
                    {s.d.label}
                    <span className="muted" style={{ marginLeft: 4 }}>vs mês anterior</span>
                  </div>
                ) : s.extra ? (
                  <div className="muted text-sm">{s.extra}</div>
                ) : null}
                <Spark values={s.sparkValues} />
              </div>
            ))}
      </div>

      {/* Two-column cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }} className="dash-cols">

        {/* Geo distribution */}
        <Card>
          <CardHeader
            title="Distribuição geográfica"
            desc={
              geoTab === 'estado' ? `Parceiros por estado · top ${geoList.length}`
              : geoTab === 'cidade' ? `Parceiros por cidade · top ${geoList.length}`
              : `Parceiros por tipo de pin · top ${data?.geo.byPinType.length ?? 0}`
            }
            action={
              <Segmented
                value={geoTab}
                onChange={setGeoTab}
                items={[
                  { value: 'estado', label: 'Estado' },
                  { value: 'cidade', label: 'Cidade' },
                  { value: 'tipo', label: 'Tipo' },
                ]}
              />
            }
          />
          <div style={{ padding: '12px 24px 20px' }}>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ padding: '8px 0', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Skeleton h={12} w={40} />
                    <Skeleton h={7} style={{ flex: 1 }} />
                    <Skeleton h={12} w={32} />
                  </div>
                ))
              : geoTab !== 'tipo'
              ? geoList.length > 0
                ? geoList.map((r) => <GeoRow key={r.label} label={r.label} count={r.count} max={geoMax} />)
                : <div className="muted text-sm" style={{ padding: '16px 0', textAlign: 'center' }}>Sem dados geográficos ainda</div>
              : data?.geo.byPinType.length
              ? data.geo.byPinType.map((r) => <PinTypeRow key={r.id} name={r.name} color={r.color} count={r.count} max={pinTypeMax} />)
              : <div className="muted text-sm" style={{ padding: '16px 0', textAlign: 'center' }}>Nenhum tipo de pin atribuído</div>
            }
          </div>
        </Card>

        {/* Recent imports */}
        <Card>
          <CardHeader
            title="Imports recentes"
            action={
              <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => navigate('/import')}>
                Ver todos
              </button>
            }
          />
          <div style={{ padding: '4px 8px' }}>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: 12, alignItems: 'flex-start' }}>
                    <Skeleton h={28} w={28} r={7} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Skeleton h={13} w="70%" />
                      <Skeleton h={11} w="40%" />
                    </div>
                  </div>
                ))
              : data?.recentImports.length === 0
              ? (
                <div className="muted text-sm" style={{ padding: '24px 16px', textAlign: 'center' }}>
                  Nenhum import realizado ainda
                </div>
              )
              : data?.recentImports.map((imp) => {
                  const s = statusLabel(imp.status)
                  const tone = imp.status === 'done' ? 'success' : imp.status === 'failed' ? 'danger' : undefined
                  return (
                    <div
                      key={imp.id}
                      style={{ display: 'flex', gap: 10, padding: 12, borderRadius: 8, alignItems: 'flex-start', cursor: 'pointer' }}
                      onClick={() => navigate('/import')}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                        background: tone === 'success' ? 'var(--success-soft)' : tone === 'danger' ? 'var(--danger-soft, color-mix(in srgb, var(--danger) 12%, transparent))' : 'var(--bg-subtle)',
                        color: tone === 'success' ? 'var(--success)' : tone === 'danger' ? 'var(--danger)' : 'var(--fg-muted)',
                        display: 'grid', placeItems: 'center',
                      }}>
                        <I.upload />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                          <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {imp.fileName || 'Arquivo desconhecido'}
                          </span>
                          <span style={{ fontSize: 12, color: s.color, fontWeight: 600, flexShrink: 0 }}>{s.text}</span>
                        </div>
                        <div className="muted text-xs" style={{ marginTop: 2, display: 'flex', gap: 8 }}>
                          <span>{imp.userName}</span>
                          <span>·</span>
                          {imp.status === 'done' && (
                            <span>{imp.created > 0 ? `+${imp.created} criados` : ''}{imp.updated > 0 ? ` ${imp.updated} atualizados` : ''}{imp.removed > 0 ? ` ${imp.removed} removidos` : ''}</span>
                          )}
                          {imp.status !== 'done' && <span>{imp.totalRows > 0 ? `${imp.totalRows} linhas` : ''}</span>}
                          <span>·</span>
                          <span>{relativeTime(imp.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
          </div>
        </Card>
      </div>

      <style>{`@media (max-width: 960px) { .dash-cols { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
