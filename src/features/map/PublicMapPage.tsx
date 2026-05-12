import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import L from 'leaflet'
import { api } from '../../lib/api'
import type { MapPin } from '../../types'
import { makeClusterGroup, makePinIcon } from './mapUtils'

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
  const lines = [pin.address, [pin.city, pin.state].filter(Boolean).join(' / ')].filter(Boolean)
  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      background: 'var(--bg-elev)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,.18)',
      padding: '14px 18px',
      minWidth: 260,
      maxWidth: 340,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{pin.name}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: 2, lineHeight: 1, flexShrink: 0 }}>✕</button>
      </div>
      {lines.map((line, i) => <div key={i} style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{line}</div>)}
      {pin.pinType && (
        <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: pin.pinType.color ?? 'var(--fg-muted)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: pin.pinType.color ?? 'var(--fg-muted)', flexShrink: 0 }} />
          {pin.pinType.name}
        </div>
      )}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--fg)',
  fontSize: 13,
  outline: 'none',
  cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--fg)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--fg-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 4,
  display: 'block',
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
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  const [filters, setFilters] = useState<Filters>({ state: '', city: '', pinTypeId: '', search: '' })

  // Load initial data
  useEffect(() => {
    if (!token) return
    Promise.all([
      api.maps.publicPins(token),
      api.maps.publicLocalities(token),
      api.maps.publicPinTypes(token),
    ])
      .then(([pins, localities, types]) => {
        setAllPins(pins)
        setStates(localities.states)
        setCities(localities.cities)
        setPinTypes(types)
        setReady(true)
      })
      .catch(() => setError('Mapa não encontrado ou acesso negado.'))
  }, [token])

  // When state filter changes, reload cities
  useEffect(() => {
    if (!token || !ready) return
    api.maps.publicLocalities(token, filters.state || undefined)
      .then((l) => setCities(l.cities))
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

  // Apply filters client-side (instant feedback) + re-fetch server-side for pinTypeId/city/state
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

  // Update markers when filtered pins change
  useEffect(() => {
    if (!clusterGroup.current) return
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, allPins, ready])

  const hasActiveFilters = filters.state || filters.city || filters.pinTypeId || filters.search
  const resetFilters = () => setFilters({ state: '', city: '', pinTypeId: '', search: '' })

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🗺️</div>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', background: 'var(--bg-elev)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div className="sidebar-mark" style={{ width: 28, height: 28 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" />
            <circle cx="12" cy="9" r="2.5" fill="currentColor" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>atlasync</div>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            {filtered.length} parceiro{filtered.length !== 1 ? 's' : ''}
            {hasActiveFilters ? ` de ${allPins.length}` : ''}
          </div>
        </div>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
            background: hasActiveFilters ? 'var(--accent)' : 'var(--bg)',
            color: hasActiveFilters ? '#fff' : 'var(--fg)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Filtros
          {hasActiveFilters && (
            <span style={{ background: 'rgba(255,255,255,.3)', borderRadius: 10, padding: '0 6px', fontSize: 11 }}>
              {[filters.state, filters.city, filters.pinTypeId, filters.search].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Filter panel */}
        {filtersOpen && (
          <div style={{
            width: 240,
            flexShrink: 0,
            background: 'var(--bg-elev)',
            borderRight: '1px solid var(--border)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Filtros</span>
              {hasActiveFilters && (
                <button onClick={resetFilters} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', padding: 0 }}>
                  Limpar
                </button>
              )}
            </div>

            {/* Search */}
            <div>
              <label style={labelStyle}>Busca</label>
              <input
                style={inputStyle}
                placeholder="Nome ou endereço…"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>

            {/* Estado */}
            <div>
              <label style={labelStyle}>Estado</label>
              <select
                style={selectStyle}
                value={filters.state}
                onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value, city: '' }))}
              >
                <option value="">Todos</option>
                {states.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Cidade */}
            <div>
              <label style={labelStyle}>Cidade</label>
              <select
                style={selectStyle}
                value={filters.city}
                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                disabled={!cities.length}
              >
                <option value="">Todas</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Tipo de pin */}
            {pinTypes.length > 0 && (
              <div>
                <label style={labelStyle}>Tipo</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    onClick={() => setFilters((f) => ({ ...f, pinTypeId: '' }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)',
                      background: !filters.pinTypeId ? 'var(--bg-subtle)' : 'transparent',
                      cursor: 'pointer', fontSize: 13, color: 'var(--fg)', textAlign: 'left',
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--fg-muted)', flexShrink: 0 }} />
                    Todos
                  </button>
                  {pinTypes.map((pt) => (
                    <button
                      key={pt.id}
                      onClick={() => setFilters((f) => ({ ...f, pinTypeId: f.pinTypeId === pt.id ? '' : pt.id }))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)',
                        background: filters.pinTypeId === pt.id ? pt.color + '22' : 'transparent',
                        cursor: 'pointer', fontSize: 13, color: 'var(--fg)', textAlign: 'left',
                        outline: filters.pinTypeId === pt.id ? `2px solid ${pt.color}` : 'none',
                        outlineOffset: -1,
                      }}
                    >
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: pt.color, flexShrink: 0 }} />
                      {pt.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          {!ready && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
              <div style={{ color: 'var(--fg-muted)' }}>Carregando mapa…</div>
            </div>
          )}
          {selectedPin && <InfoPopup pin={selectedPin} onClose={() => setSelectedPin(null)} />}
        </div>
      </div>
    </div>
  )
}
