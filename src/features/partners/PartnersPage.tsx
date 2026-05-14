import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Partner, PinType } from '../../types'
import { Badge, Button, ConfirmDialog, Empty, Select, Skeleton, useToast } from '../../components/ui'
import { I } from '../../components/icons'
import PartnerSheet from './PartnerSheet'
import GeocodingFailuresBanner from './GeocodingFailuresBanner'

const GEOCODE_LABELS: Record<string, string> = {
  done: 'Geocodificado',
  failed: 'Erro',
  pending: 'Pendente',
}
const GEOCODE_TONE: Record<string, 'success' | 'danger' | 'warning'> = {
  done: 'success',
  failed: 'danger',
  pending: 'warning',
}

export default function PartnersPage() {
  const qc = useQueryClient()
  const { push } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)

  // filters
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('') // debounced
  const [visibility, setVisibility] = useState<'public' | 'internal' | ''>('')
  const [pinTypeId, setPinTypeId] = useState('')
  const [geocodeStatus, setGeoStatus] = useState<'pending' | 'done' | 'failed' | ''>('')
  const [source, setSource] = useState<'dashboard' | 'import' | ''>('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [page, setPage] = useState(1)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<Partner | null>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  // Open edit sheet when ?edit=partnerId is present in the URL
  const editId = searchParams.get('edit')
  useEffect(() => {
    if (!editId) return
    api.partners.getById(editId).then((partner) => {
      setEditing(partner)
      setSheetOpen(true)
      setSearchParams((prev) => { const n = new URLSearchParams(prev); n.delete('edit'); return n }, { replace: true })
    }).catch(() => {
      setSearchParams((prev) => { const n = new URLSearchParams(prev); n.delete('edit'); return n }, { replace: true })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  const { data: pinTypes = [] } = useQuery<PinType[]>({
    queryKey: ['pinTypes'],
    queryFn: () => api.pinTypes.list(),
    staleTime: 60_000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['partners', page, search, visibility, pinTypeId, geocodeStatus, source],
    queryFn: () => api.partners.list({
      page,
      limit: 20,
      search: search || undefined,
      visibility: visibility || undefined,
      pinTypeId: pinTypeId || undefined,
      geocodeStatus: (geocodeStatus || undefined) as 'pending' | 'done' | 'failed' | undefined,
      source: (source || undefined) as 'dashboard' | 'import' | undefined,
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.partners.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] })
      push({ title: 'Parceiro removido', tone: 'success' })
    },
    onError: () => push({ title: 'Erro ao remover parceiro', tone: 'error' }),
  })

  const openNew = () => { setEditing(null); setSheetOpen(true) }
  const openEdit = (p: Partner) => { setEditing(p); setSheetOpen(true) }

  const totalPages = data ? Math.ceil(data.total / 20) : 1

  const activeFilters = [visibility, pinTypeId, geocodeStatus, source].filter(Boolean).length
  const hasAnyFilter = !!search || activeFilters > 0

  const clearFilters = () => {
    setSearchInput(''); setSearch('')
    setVisibility(''); setPinTypeId(''); setGeoStatus(''); setSource('')
    setPage(1)
    searchRef.current?.focus()
  }

  return (
    <div className="page">
      <GeocodingFailuresBanner />

      <div className="page-header">
        <div className="page-title-block">
          <h1 className="h1">Parceiros</h1>
          <div className="muted text-sm">
            {data?.total ?? 0} parceiro{data?.total !== 1 ? 's' : ''} cadastrado{data?.total !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="page-actions">
          <Button variant="primary" leftIcon={<I.plus size={14} />} onClick={openNew}>
            Novo parceiro
          </Button>
        </div>
      </div>

      {/* ── Controls + Table ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div className="input-with-icon" style={{ flex: '1 1 240px', maxWidth: 360 }}>
          <I.search size={14} />
          <input
            ref={searchRef}
            className="input"
            placeholder="Buscar por nome ou endereço…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearch('') }}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--fg-muted)', display: 'flex', padding: 0,
              }}
            >
              <I.close size={13} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          className={`btn btn-ghost`}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            borderColor: activeFilters > 0 ? 'var(--accent)' : undefined,
            color: activeFilters > 0 ? 'var(--accent)' : undefined,
          }}
          onClick={() => setFiltersOpen(v => !v)}
        >
          <I.filter size={14} />
          Filtros
          {activeFilters > 0 && (
            <span style={{
              background: 'var(--accent)', color: '#fff',
              borderRadius: 99, fontSize: 11, fontWeight: 700,
              padding: '1px 6px', lineHeight: 1.5,
            }}>{activeFilters}</span>
          )}
        </button>

        {/* Clear all */}
        {hasAnyFilter && (
          <button
            className="btn btn-ghost"
            style={{ color: 'var(--fg-muted)', fontSize: 13 }}
            onClick={clearFilters}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* ── Filter panel ── */}
      {filtersOpen && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
          padding: '16px 18px',
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: 10,
        }}>
          <FilterGroup label="Visibilidade">
            <Select value={visibility} onChange={e => { setVisibility(e.target.value as typeof visibility); setPage(1) }}>
              <option value="">Todas</option>
              <option value="public">Público</option>
              <option value="internal">Interno</option>
            </Select>
          </FilterGroup>

          <FilterGroup label="Tipo de pin">
            <Select value={pinTypeId} onChange={e => { setPinTypeId(e.target.value); setPage(1) }}>
              <option value="">Todos</option>
              {pinTypes.map(pt => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </Select>
          </FilterGroup>

          <FilterGroup label="Status geocoding">
            <Select value={geocodeStatus} onChange={e => { setGeoStatus(e.target.value as typeof geocodeStatus); setPage(1) }}>
              <option value="">Todos</option>
              <option value="done">Geocodificado</option>
              <option value="pending">Pendente</option>
              <option value="failed">Com erro</option>
            </Select>
          </FilterGroup>

          <FilterGroup label="Origem">
            <Select value={source} onChange={e => { setSource(e.target.value as typeof source); setPage(1) }}>
              <option value="">Todas</option>
              <option value="dashboard">Manual</option>
              <option value="import">Importação</option>
            </Select>
          </FilterGroup>
        </div>
      )}

      {/* ── Active filter chips ── */}
      {activeFilters > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {visibility && (
            <FilterChip label={`Visibilidade: ${visibility === 'public' ? 'Público' : 'Interno'}`} onRemove={() => { setVisibility(''); setPage(1) }} />
          )}
          {pinTypeId && (
            <FilterChip label={`Tipo: ${pinTypes.find(p => p.id === pinTypeId)?.name ?? pinTypeId}`} onRemove={() => { setPinTypeId(''); setPage(1) }} />
          )}
          {geocodeStatus && (
            <FilterChip label={`Geocoding: ${GEOCODE_LABELS[geocodeStatus]}`} onRemove={() => { setGeoStatus(''); setPage(1) }} />
          )}
          {source && (
            <FilterChip label={`Origem: ${source === 'dashboard' ? 'Manual' : 'Importação'}`} onRemove={() => { setSource(''); setPage(1) }} />
          )}
        </div>
      )}

      {/* ── Table ── */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(8)].map((_, i) => <Skeleton key={i} h={44} />)}
        </div>
      ) : data?.data.length === 0 ? (
        <Empty
          icon={<I.partners size={32} />}
          title={hasAnyFilter ? 'Nenhum resultado para os filtros aplicados' : 'Nenhum parceiro encontrado'}
          desc={hasAnyFilter ? 'Tente ajustar ou limpar os filtros.' : 'Adicione seu primeiro parceiro para começar.'}
          action={hasAnyFilter
            ? <Button variant="ghost" onClick={clearFilters}>Limpar filtros</Button>
            : <Button variant="primary" onClick={openNew}>Novo parceiro</Button>
          }
        />
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Endereço</th>
                <th>Cidade / Estado</th>
                <th>Tipo de pin</th>
                <th>Visibilidade</th>
                <th>Geocoding</th>
                <th>Origem</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {data?.data.map((p) => (
                <tr key={p.id}>
                  <td><span style={{ fontWeight: 500 }}>{p.name}</span></td>
                  <td className="muted" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.address ?? '—'}
                  </td>
                  <td className="muted">{[p.city, p.state].filter(Boolean).join(' / ') || '—'}</td>
                  <td>
                    {p.pinTypeName ? (
                      <Badge style={{ background: (p.pinTypeColor ?? '#888') + '22', color: p.pinTypeColor ?? undefined }}>
                        {p.pinTypeName}
                      </Badge>
                    ) : <span className="muted">—</span>}
                  </td>
                  <td>
                    <Badge tone={p.visibility === 'public' ? 'success' : 'info'}>
                      {p.visibility === 'public' ? 'Público' : 'Interno'}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={GEOCODE_TONE[p.geocodeStatus ?? 'pending']} dot>
                      {GEOCODE_LABELS[p.geocodeStatus ?? 'pending']}
                    </Badge>
                  </td>
                  <td>
                    <span className="muted text-sm">
                      {p.source === 'import' ? 'Importação' : 'Manual'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="icon-btn" onClick={() => openEdit(p)} title="Editar">
                        <I.edit size={14} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => setConfirmTarget(p)}
                        title="Remover"
                        style={{ color: 'var(--danger)' }}
                      >
                        <I.trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                ← Anterior
              </Button>
              <span className="muted text-sm">Página {page} de {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Próxima →
              </Button>
            </div>
          )}
        </>
      )}

      </div>{/* end controls + table wrapper */}

      <PartnerSheet open={sheetOpen} onClose={() => setSheetOpen(false)} partner={editing} />

      <ConfirmDialog
        open={!!confirmTarget}
        title={`Remover "${confirmTarget?.name}"?`}
        desc="Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        onConfirm={() => { if (confirmTarget) deleteMutation.mutate(confirmTarget.id); setConfirmTarget(null) }}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      {children}
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px 3px 10px', borderRadius: 99,
      background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
      border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
      fontSize: 12, color: 'var(--accent)', fontWeight: 500,
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{
          display: 'flex', background: 'none', border: 'none',
          cursor: 'pointer', padding: 0, color: 'var(--accent)', opacity: 0.7,
        }}
      >
        <I.close size={11} />
      </button>
    </span>
  )
}
