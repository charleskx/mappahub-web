import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { api } from '../../lib/api'
import { Badge, Select } from '../../components/ui'
import { I } from '../../components/icons'
import type { MapPin, PartnerColumn } from '../../types'
import { makeClusterGroup, makePinIcon } from './mapUtils'

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Filters {
  search: string
  state: string
  city: string
  pinTypeId: string
  visibility: string
}

// ── InfoPopup ─────────────────────────────────────────────────────────────────
function InfoPopup({ pin, onClose }: { pin: MapPin; onClose: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')
  const [notesDirty, setNotesDirty] = useState(false)

  const { data: partner, isLoading } = useQuery({
    queryKey: ['partner', pin.id],
    queryFn: () => api.partners.getById(pin.id),
    staleTime: 30_000,
  })

  const { data: columns = [] } = useQuery<PartnerColumn[]>({
    queryKey: ['partnerColumns'],
    queryFn: () => api.partners.getColumns(),
    staleTime: 60_000,
  })

  // Sync notes from fetched partner
  useEffect(() => {
    if (partner && !notesDirty) {
      setNotes(partner.notes ?? '')
    }
  }, [partner, notesDirty])

  const saveNotes = useMutation({
    mutationFn: () => api.partners.update(pin.id, { notes }),
    onSuccess: () => {
      setNotesDirty(false)
      queryClient.invalidateQueries({ queryKey: ['partner', pin.id] })
    },
  })

  const handleEdit = () => {
    onClose()
    navigate(`/partners?edit=${pin.id}`)
  }

  const geocodeLabel: Record<string, string> = {
    done: 'Geocodificado',
    pending: 'Aguardando geocodificação',
    failed: 'Falha na geocodificação',
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        bottom: 16,
        width: 360,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3, wordBreak: 'break-word' }}>
            {pin.name}
          </div>
          {pin.pinType && (
            <Badge style={{ marginTop: 6, background: (pin.pinType.color ?? '#888') + '22', color: pin.pinType.color ?? undefined }}>
              {pin.pinType.name}
            </Badge>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            className="btn btn-primary"
            style={{ fontSize: 12, padding: '4px 10px', height: 28, display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={handleEdit}
          >
            <I.edit size={12} />
            Editar
          </button>
          <button className="icon-btn" onClick={onClose}><I.x size={14} /></button>
        </div>
      </div>

      {/* Body — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32, color: 'var(--fg-muted)', fontSize: 13 }}>
            Carregando…
          </div>
        ) : (
          <>
            {/* Standard fields */}
            <Section label="Informações">
              <Field label="Endereço" value={partner?.address ?? pin.address} />
              <Field label="Cidade / Estado" value={[partner?.city ?? pin.city, partner?.state ?? pin.state].filter(Boolean).join(' / ')} />
              <Field label="Visibilidade" value={(partner?.visibility ?? pin.visibility) === 'public' ? 'Público' : 'Interno'} />
              {partner?.geocodeStatus && (
                <Field label="Geocodificação" value={geocodeLabel[partner.geocodeStatus] ?? partner.geocodeStatus} />
              )}
            </Section>

            {/* Custom / dynamic fields */}
            {columns.length > 0 && partner?.dynamicValues && Object.keys(partner.dynamicValues).some(k => partner.dynamicValues![k] != null) && (
              <Section label="Campos personalizados">
                {columns.map(col => {
                  const val = partner.dynamicValues?.[col.key]
                  if (!val) return null
                  return <Field key={col.key} label={col.label} value={val} />
                })}
              </Section>
            )}

            {/* Observation / notes */}
            <Section label="Observação">
              <textarea
                className="input"
                style={{ width: '100%', minHeight: 90, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 13 }}
                placeholder="Adicione uma observação…"
                value={notes}
                onChange={e => { setNotes(e.target.value); setNotesDirty(true) }}
              />
              {notesDirty && (
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 6, fontSize: 12, padding: '4px 12px', height: 28, alignSelf: 'flex-end' }}
                  onClick={() => saveNotes.mutate()}
                  disabled={saveNotes.isPending}
                >
                  {saveNotes.isPending ? 'Salvando…' : 'Salvar'}
                </button>
              )}
              {saveNotes.isSuccess && !notesDirty && (
                <span style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>Salvo ✓</span>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.4 }}>{value}</span>
    </div>
  )
}

// ── FilterPanel ───────────────────────────────────────────────────────────────
interface FilterPanelProps {
  filters: Filters
  states: string[]
  cities: string[]
  pinTypes: { id: string; name: string; color: string }[]
  onChange: (f: Filters) => void
}

function FilterPanel({ filters, states, cities, pinTypes, onChange }: FilterPanelProps) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const hasActive = filters.search || filters.state || filters.city || filters.pinTypeId || filters.visibility

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Filtros</span>
        {hasActive && (
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '2px 8px', height: 26 }}
            onClick={() => onChange({ search: '', state: '', city: '', pinTypeId: '', visibility: '' })}
          >
            Limpar
          </button>
        )}
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Busca</label>
          <div style={{ position: 'relative' }}>
            <I.search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 30, width: '100%', boxSizing: 'border-box' }}
              placeholder="Nome ou endereço…"
              value={filters.search}
              onChange={(e) => set({ search: e.target.value })}
            />
          </div>
        </div>

        {/* Estado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estado</label>
          <Select value={filters.state} onChange={(e) => set({ state: e.target.value, city: '' })} style={{ width: '100%' }}>
            <option value="">Todos</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>

        {/* Cidade */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cidade</label>
          <Select value={filters.city} onChange={(e) => set({ city: e.target.value })} style={{ width: '100%' }} disabled={!cities.length}>
            <option value="">Todas</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>

        {/* Visibilidade */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Visibilidade</label>
          <Select value={filters.visibility} onChange={(e) => set({ visibility: e.target.value })} style={{ width: '100%' }}>
            <option value="">Todas</option>
            <option value="public">Público</option>
            <option value="internal">Interno</option>
          </Select>
        </div>

        {/* Tipo de pin */}
        {pinTypes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo de pin</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[{ id: '', name: 'Todos', color: '' }, ...pinTypes].map((pt) => {
                const active = filters.pinTypeId === pt.id
                return (
                  <button
                    key={pt.id}
                    onClick={() => set({ pinTypeId: active && pt.id ? '' : pt.id })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 10px', borderRadius: 6, textAlign: 'left', width: '100%',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      background: active ? 'var(--accent-subtle, #4f46e510)' : 'transparent',
                      color: 'var(--fg)', fontSize: 13, fontWeight: active ? 600 : 400,
                      cursor: 'pointer', transition: 'all .12s',
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: pt.color || 'var(--fg-muted)', flexShrink: 0, display: 'inline-block' }} />
                    {pt.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── MapPage ───────────────────────────────────────────────────────────────────
export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const clusterGroup = useRef<L.MarkerClusterGroup | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [filters, setFilters] = useState<Filters>({ search: '', state: '', city: '', pinTypeId: '', visibility: '' })

  const { data: allPins = [] } = useQuery({
    queryKey: ['partnerPins'],
    queryFn: () => api.partners.pins(),
  })

  // Derived options from loaded pins
  const states = useMemo(() => [...new Set(allPins.map((p) => p.state).filter(Boolean))].sort() as string[], [allPins])
  const cities = useMemo(() => {
    const source = filters.state ? allPins.filter((p) => p.state === filters.state) : allPins
    return [...new Set(source.map((p) => p.city).filter(Boolean))].sort() as string[]
  }, [allPins, filters.state])
  const pinTypes = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; color: string }>()
    allPins.forEach((p) => { if (p.pinType?.id) seen.set(p.pinType.id, p.pinType as { id: string; name: string; color: string }) })
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [allPins])

  // Client-side filtering
  const filtered = useMemo(() => allPins.filter((p) => {
    if (filters.state && p.state !== filters.state) return false
    if (filters.city && p.city !== filters.city) return false
    if (filters.visibility && p.visibility !== filters.visibility) return false
    if (filters.pinTypeId && p.pinType?.id !== filters.pinTypeId) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !p.address?.toLowerCase().includes(q)) return false
    }
    return true
  }), [allPins, filters])

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    const map = L.map(mapRef.current, { center: [-15.7942, -47.8825], zoom: 5 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    const cluster = makeClusterGroup()
    map.addLayer(cluster)
    mapInstance.current = map
    clusterGroup.current = cluster
    setMapReady(true)

    return () => {
      map.remove()
      mapInstance.current = null
      clusterGroup.current = null
      setMapReady(false)
    }
  }, [])

  // Invalidate size when sidebar opens/closes
  useEffect(() => {
    if (mapInstance.current) {
      setTimeout(() => mapInstance.current?.invalidateSize(), 260)
    }
  }, [sidebarOpen])

  // Update markers when filtered pins or map readiness changes
  useEffect(() => {
    if (!mapReady || !clusterGroup.current) return
    clusterGroup.current.clearLayers()
    setSelectedPin(null)

    const valid = filtered.filter((p) => p.lat && p.lng)
    valid.forEach((pin) => {
      const marker = L.marker([Number(pin.lat), Number(pin.lng)], {
        icon: makePinIcon(pin.pinType?.color ?? '#6366f1'),
        title: pin.name,
      })
      marker.on('click', () => setSelectedPin((prev) => prev?.id === pin.id ? null : pin))
      clusterGroup.current!.addLayer(marker)
    })

    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map((p) => [Number(p.lat), Number(p.lng)]))
      mapInstance.current?.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 })
    }
  }, [filtered, mapReady])

  const activeCount = [filters.search, filters.state, filters.city, filters.pinTypeId, filters.visibility].filter(Boolean).length

  return (
    <div className="page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="h1">Mapa interno</h1>
          <div className="muted text-sm">
            <span style={{ fontWeight: 600, color: 'var(--fg)' }}>{filtered.length}</span>
            {filtered.length !== allPins.length && <span> de {allPins.length}</span>}
            {' '}parceiro{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <I.filter size={14} />
            Filtros
            {activeCount > 0 && (
              <span style={{ background: 'var(--accent)', color: 'var(--accent-fg)', borderRadius: 10, padding: '0 6px', fontSize: 11, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Body: sidebar + map */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {/* Filter sidebar */}
        {sidebarOpen && (
          <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-elev)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <FilterPanel
              filters={filters}
              states={states}
              cities={cities}
              pinTypes={pinTypes}
              onChange={setFilters}
            />
          </div>
        )}

        {/* Map */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
          {selectedPin && <InfoPopup pin={selectedPin} onClose={() => setSelectedPin(null)} />}
        </div>
      </div>
    </div>
  )
}
