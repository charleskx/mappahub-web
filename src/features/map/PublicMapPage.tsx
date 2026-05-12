import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import L from 'leaflet'
import { api } from '../../lib/api'
import type { MapPin } from '../../types'
import { makeClusterGroup, makePinIcon } from './mapUtils'

// ── Self-contained design tokens (no dependency on app CSS vars) ──────────────
const t = {
  bg: '#ffffff',
  bgSubtle: '#f8f9fa',
  bgHover: '#f1f3f5',
  border: '#e5e7eb',
  fg: '#111827',
  fgMuted: '#6b7280',
  accent: '#4f46e5',
  accentLight: '#ede9fe',
  shadow: '0 4px 24px rgba(0,0,0,.10)',
  shadowSm: '0 1px 6px rgba(0,0,0,.08)',
  radius: '10px',
  radiusSm: '6px',
}

interface Filters {
  state: string
  city: string
  pinTypeId: string
  search: string
}

interface InfoPopupProps {
  pin: MapPin
  onClose: () => void
}

function InfoPopup({ pin, onClose }: InfoPopupProps) {
  const addressLines = [pin.address, [pin.city, pin.state].filter(Boolean).join(' — ')].filter(Boolean)
  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      background: t.bg,
      border: `1px solid ${t.border}`,
      borderRadius: 14,
      boxShadow: t.shadow,
      padding: '14px 16px',
      minWidth: 240,
      maxWidth: 'min(340px, calc(100vw - 32px))',
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: t.fg, lineHeight: 1.3 }}>{pin.name}</div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.fgMuted, padding: '0 2px', fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1 }}
          aria-label="Fechar"
        >×</button>
      </div>
      {addressLines.map((line, i) => (
        <div key={i} style={{ fontSize: 13, color: t.fgMuted, lineHeight: 1.4 }}>{line}</div>
      ))}
      {pin.pinType && (
        <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: pin.pinType.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: pin.pinType.color }}>{pin.pinType.name}</span>
        </div>
      )}
    </div>
  )
}

interface FilterPanelProps {
  filters: Filters
  states: string[]
  cities: string[]
  pinTypes: { id: string; name: string; color: string }[]
  onChange: (f: Filters) => void
  onClose?: () => void
  isMobile: boolean
}

function FilterPanel({ filters, states, cities, pinTypes, onChange, onClose, isMobile }: FilterPanelProps) {
  const hasActive = filters.state || filters.city || filters.pinTypeId || filters.search
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })

  const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5 }
  const label: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: t.fgMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }
  const control: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: t.radiusSm,
    border: `1px solid ${t.border}`, background: t.bgSubtle,
    color: t.fg, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 16,
      padding: isMobile ? '0 0 24px' : '16px',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: t.fg }}>Filtros</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {hasActive && (
            <button
              onClick={() => onChange({ state: '', city: '', pinTypeId: '', search: '' })}
              style={{ background: 'none', border: 'none', fontSize: 12, color: t.accent, cursor: 'pointer', padding: 0, fontWeight: 600 }}
            >
              Limpar
            </button>
          )}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              style={{ background: t.bgHover, border: 'none', borderRadius: t.radiusSm, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: t.fg }}
            >
              Fechar
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={field}>
        <label style={label}>Busca</label>
        <input
          style={control}
          placeholder="Nome ou endereço…"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
        />
      </div>

      {/* Estado */}
      <div style={field}>
        <label style={label}>Estado</label>
        <select style={control} value={filters.state} onChange={(e) => set({ state: e.target.value, city: '' })}>
          <option value="">Todos</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Cidade */}
      <div style={field}>
        <label style={label}>Cidade</label>
        <select style={control} value={filters.city} onChange={(e) => set({ city: e.target.value })} disabled={!cities.length}>
          <option value="">Todas</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Tipo de pin */}
      {pinTypes.length > 0 && (
        <div style={field}>
          <label style={label}>Tipo</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[{ id: '', name: 'Todos', color: t.fgMuted }, ...pinTypes].map((pt) => {
              const active = filters.pinTypeId === pt.id
              return (
                <button
                  key={pt.id}
                  onClick={() => set({ pinTypeId: active && pt.id ? '' : pt.id })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 10px', borderRadius: t.radiusSm,
                    border: `1px solid ${active ? pt.color || t.accent : t.border}`,
                    background: active ? (pt.color ? pt.color + '18' : t.accentLight) : t.bgSubtle,
                    cursor: 'pointer', fontSize: 13, color: t.fg, textAlign: 'left',
                    fontFamily: 'inherit', fontWeight: active ? 600 : 400,
                    transition: 'all .12s',
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: pt.color, flexShrink: 0 }} />
                  {pt.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  )
}

export default function PublicMapPage() {
  const { token } = useParams<{ token: string }>()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const clusterGroup = useRef<L.MarkerClusterGroup | null>(null)

  const [allPins, setAllPins] = useState<MapPin[]>([])
  const [pinTypes, setPinTypes] = useState<{ id: string; name: string; color: string }[]>([])
  const [states, setStates] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const [filters, setFilters] = useState<Filters>({ state: '', city: '', pinTypeId: '', search: '' })

  // Track viewport width
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // On desktop, open panel by default
  useEffect(() => {
    if (!isMobile) setFiltersOpen(true)
  }, [isMobile])

  // Load initial data
  useEffect(() => {
    if (!token) return
    Promise.all([
      api.maps.publicPins(token),
      api.maps.publicLocalities(token),
      api.maps.publicPinTypes(token),
    ]).then(([pins, localities, types]) => {
      setAllPins(pins)
      setStates(localities.states)
      setCities(localities.cities)
      setPinTypes(types)
      setReady(true)
    }).catch(() => setError('Mapa não encontrado ou acesso negado.'))
  }, [token])

  // Update cities when state changes
  useEffect(() => {
    if (!token || !ready) return
    api.maps.publicLocalities(token, filters.state || undefined).then((l) => setCities(l.cities))
  }, [filters.state, token, ready])

  // Init map once ready
  useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current) return
    mapInstance.current = L.map(mapRef.current, { center: [-15.7942, -47.8825], zoom: 5 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstance.current)
    clusterGroup.current = makeClusterGroup()
    mapInstance.current.addLayer(clusterGroup.current)
  }, [ready])

  // Filtered pins (client-side)
  const filtered = allPins.filter((p) => {
    if (filters.state && p.state !== filters.state) return false
    if (filters.city && p.city !== filters.city) return false
    if (filters.pinTypeId && p.pinType?.id !== filters.pinTypeId) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !p.address?.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Update markers
  useEffect(() => {
    if (!clusterGroup.current) return
    clusterGroup.current.clearLayers()
    setSelectedPin(null)
    const valid = filtered.filter((p) => p.lat && p.lng)
    valid.forEach((pin) => {
      const marker = L.marker([Number(pin.lat), Number(pin.lng)], {
        icon: makePinIcon(pin.pinType?.color ?? '#4f46e5'),
        title: pin.name,
      })
      marker.on('click', () => setSelectedPin((prev) => prev?.id === pin.id ? null : pin))
      clusterGroup.current!.addLayer(marker)
    })
    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map((p) => [Number(p.lat), Number(p.lng)]))
      mapInstance.current?.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, allPins, ready])

  const hasActive = filters.state || filters.city || filters.pinTypeId || filters.search
  const activeCount = [filters.state, filters.city, filters.pinTypeId, filters.search].filter(Boolean).length

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🗺️</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: t.fg, marginBottom: 8 }}>Mapa não encontrado</div>
          <div style={{ fontSize: 14, color: t.fgMuted }}>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif', background: t.bg, color: t.fg }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        background: t.bg,
        borderBottom: `1px solid ${t.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
        boxShadow: t.shadowSm,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, color: t.accent }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" />
              <circle cx="12" cy="9" r="2.5" fill="currentColor" />
            </svg>
          </div>
          {!isMobile && (
            <span style={{ fontWeight: 700, fontSize: 14, color: t.fg, letterSpacing: '-0.01em' }}>atlasync</span>
          )}
        </div>

        {/* Count */}
        <div style={{ flex: 1, fontSize: 13, color: t.fgMuted }}>
          <span style={{ fontWeight: 600, color: t.fg }}>{filtered.length}</span>
          {' '}parceiro{filtered.length !== 1 ? 's' : ''}
          {hasActive && allPins.length !== filtered.length && (
            <span style={{ color: t.fgMuted }}> de {allPins.length}</span>
          )}
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 20,
            border: `1.5px solid ${hasActive ? t.accent : t.border}`,
            background: hasActive ? t.accent : t.bg,
            color: hasActive ? '#fff' : t.fg,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: hasActive ? `0 2px 8px ${t.accent}40` : 'none',
            transition: 'all .15s',
            fontFamily: 'inherit',
          }}
        >
          <FilterIcon />
          {!isMobile && 'Filtros'}
          {activeCount > 0 && (
            <span style={{
              background: hasActive ? 'rgba(255,255,255,.25)' : t.accent,
              color: '#fff',
              borderRadius: 10,
              padding: '0 6px',
              fontSize: 11,
              fontWeight: 700,
              minWidth: 18,
              textAlign: 'center',
            }}>
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Desktop sidebar */}
        {!isMobile && filtersOpen && (
          <div style={{
            width: 240,
            flexShrink: 0,
            background: t.bg,
            borderRight: `1px solid ${t.border}`,
            overflowY: 'auto',
            boxShadow: '2px 0 8px rgba(0,0,0,.04)',
          }}>
            <FilterPanel
              filters={filters}
              states={states}
              cities={cities}
              pinTypes={pinTypes}
              onChange={setFilters}
              isMobile={false}
            />
          </div>
        )}

        {/* Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          {!ready && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: t.bg, gap: 12 }}>
              <div style={{ width: 36, height: 36, border: `3px solid ${t.border}`, borderTopColor: t.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: 13, color: t.fgMuted }}>Carregando mapa…</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}
          {selectedPin && <InfoPopup pin={selectedPin} onClose={() => setSelectedPin(null)} />}
        </div>
      </div>

      {/* Mobile bottom sheet — fora do overflow:hidden para não ser recortado */}
      {isMobile && filtersOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500 }}>
          <div
            onClick={() => setFiltersOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            background: t.bg,
            borderRadius: '18px 18px 0 0',
            boxShadow: '0 -4px 32px rgba(0,0,0,.18)',
            maxHeight: '78vh',
            overflowY: 'auto',
            padding: '10px 20px 0',
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: t.border, margin: '0 auto 14px' }} />
            <FilterPanel
              filters={filters}
              states={states}
              cities={cities}
              pinTypes={pinTypes}
              onChange={setFilters}
              onClose={() => setFiltersOpen(false)}
              isMobile={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}
