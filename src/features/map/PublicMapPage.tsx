import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { GoogleMap, MarkerClusterer, Marker, Circle, useJsApiLoader } from '@react-google-maps/api'
import { api } from '../../lib/api'
import type { MapPin, PublicMapBranding } from '../../types'
import { makePinIconUrl, PIN_ICON_SIZE } from './mapUtils'

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''

// ── Design tokens ─────────────────────────────────────────────────────────────
const t = {
  bg: '#ffffff',
  bgSubtle: '#f8f9fa',
  bgHover: '#f1f3f5',
  border: '#e5e7eb',
  fg: '#111827',
  fgMuted: '#6b7280',
  accent: '#4f46e5',
  accentLight: '#ede9fe',
  geo: '#2563eb',
  shadow: '0 4px 24px rgba(0,0,0,.10)',
  shadowSm: '0 1px 6px rgba(0,0,0,.08)',
  radiusSm: '6px',
}

// ── Haversine distance (km) ───────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`
}

const RADIUS_OPTIONS = [10, 25, 50, 100, 200]

// ── Geo error types ───────────────────────────────────────────────────────────
type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable'

const GEO_ERROR: Record<GeoStatus, { label: string; retryable: boolean }> = {
  idle:        { label: '',                                                           retryable: false },
  loading:     { label: 'Localizando…',                                               retryable: false },
  granted:     { label: 'Localização ativa',                                          retryable: false },
  denied:      { label: 'Permissão negada pelo navegador',                            retryable: false },
  unavailable: { label: 'Verifique as permissões de localização do sistema',          retryable: true  },
}

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Filters {
  state: string
  city: string
  pinTypeId: string
  search: string
}

interface UserLocation {
  lat: number
  lng: number
}

// ── InfoPopup ─────────────────────────────────────────────────────────────────
interface InfoPopupProps {
  pin: MapPin
  distance?: number
  onClose: () => void
}

const NAV_APPS = [
  {
    label: 'Google Maps',
    icon: 'https://www.google.com/favicon.ico',
    url: (address: string) =>
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
  },
  {
    label: 'Waze',
    icon: 'https://www.waze.com/favicon.ico',
    url: (address: string) =>
      `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`,
  },
  {
    label: 'Apple Maps',
    icon: 'https://www.apple.com/favicon.ico',
    url: (address: string) =>
      `https://maps.apple.com/?daddr=${encodeURIComponent(address)}`,
  },
]

function InfoPopup({ pin, distance, onClose }: InfoPopupProps) {
  const [navOpen, setNavOpen] = useState(false)
  const addressLines = [pin.address, [pin.city, pin.state].filter(Boolean).join(' — ')].filter(Boolean)
  const hasCoords = pin.lat != null && pin.lng != null

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
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.fgMuted, padding: '0 2px', fontSize: 18, lineHeight: 1, flexShrink: 0 }} aria-label="Fechar">×</button>
      </div>
      {addressLines.map((line, i) => (
        <div key={i} style={{ fontSize: 13, color: t.fgMuted, lineHeight: 1.4 }}>{line}</div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
        {pin.pinType && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: pin.pinType.color, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: pin.pinType.color }}>{pin.pinType.name}</span>
          </div>
        )}
        {distance !== undefined && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 600, color: t.geo,
            background: `${t.geo}12`, borderRadius: 20, padding: '2px 8px',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 21s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>
            {formatDist(distance)}
          </div>
        )}
      </div>

      {hasCoords && (
        <div style={{ position: 'relative', marginTop: 6 }}>
          <button
            onClick={() => setNavOpen(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 8, border: `1px solid ${t.border}`,
              background: t.bgSubtle, color: t.fg, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            Como chegar
          </button>
          {navOpen && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
              background: t.bg, border: `1px solid ${t.border}`,
              borderRadius: 10, overflow: 'hidden',
              boxShadow: t.shadow, zIndex: 10,
            }}>
              {NAV_APPS.map(app => (
                <a
                  key={app.label}
                  href={app.url(pin.address ?? '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setNavOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', color: t.fg, fontSize: 13, fontWeight: 500,
                    textDecoration: 'none', borderBottom: `1px solid ${t.border}`,
                  }}
                >
                  <img src={app.icon} width={16} height={16} style={{ borderRadius: 3 }} alt="" />
                  {app.label}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── FilterPanel ───────────────────────────────────────────────────────────────
interface FilterPanelProps {
  filters: Filters
  states: string[]
  cities: string[]
  pinTypes: { id: string; name: string; color: string }[]
  userLocation: UserLocation | null
  geoStatus: GeoStatus
  radius: number
  onChange: (f: Filters) => void
  onRequestGeo: () => void
  onClearGeo: () => void
  onRadiusChange: (r: number) => void
  onClose?: () => void
  isMobile: boolean
}

function FilterPanel({
  filters, states, cities, pinTypes,
  userLocation, geoStatus, radius,
  onChange, onRequestGeo, onClearGeo, onRadiusChange,
  onClose, isMobile,
}: FilterPanelProps) {
  const hasActive = filters.state || filters.city || filters.pinTypeId || filters.search || userLocation
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })

  const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5 }
  const label: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: t.fgMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }
  const control: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: t.radiusSm,
    border: `1px solid ${t.border}`, background: t.bgSubtle,
    color: t.fg, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: isMobile ? '0 0 24px' : '16px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: t.fg }}>Filtros</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {hasActive && (
            <button
              onClick={() => { onChange({ state: '', city: '', pinTypeId: '', search: '' }); onClearGeo() }}
              style={{ background: 'none', border: 'none', fontSize: 12, color: t.accent, cursor: 'pointer', padding: 0, fontWeight: 600 }}
            >
              Limpar
            </button>
          )}
          {isMobile && onClose && (
            <button onClick={onClose} style={{ background: t.bgHover, border: 'none', borderRadius: t.radiusSm, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: t.fg }}>Fechar</button>
          )}
        </div>
      </div>

      <div style={field}>
        <label style={label}>Localização</label>
        {!userLocation ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={onRequestGeo}
              disabled={geoStatus === 'loading' || geoStatus === 'denied'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '9px 12px', borderRadius: t.radiusSm,
                border: `1.5px solid ${geoStatus === 'denied' ? t.border : geoStatus === 'unavailable' ? '#f59e0b' : t.geo}`,
                background: geoStatus === 'denied' ? t.bgSubtle : geoStatus === 'unavailable' ? '#fffbeb' : `${t.geo}10`,
                color: geoStatus === 'denied' ? t.fgMuted : geoStatus === 'unavailable' ? '#b45309' : t.geo,
                fontSize: 13, fontWeight: 600,
                cursor: geoStatus === 'loading' || geoStatus === 'denied' ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all .15s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              </svg>
              {geoStatus === 'loading' ? 'Localizando…'
                : geoStatus === 'denied' ? 'Permissão negada'
                : geoStatus === 'unavailable' ? 'Tentar novamente'
                : 'Usar minha localização'}
            </button>
            {(geoStatus === 'denied' || geoStatus === 'unavailable') && (
              <div style={{ fontSize: 11, color: geoStatus === 'unavailable' ? '#b45309' : t.fgMuted, lineHeight: 1.4, padding: '0 2px' }}>
                {GEO_ERROR[geoStatus].label}
                {geoStatus === 'unavailable' && (
                  <span> — verifique em <strong>Configurações › Privacidade › Localização</strong></span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: t.radiusSm,
              background: `${t.geo}10`, border: `1px solid ${t.geo}40`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: t.geo }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                </svg>
                Localização ativa
              </div>
              <button onClick={onClearGeo} style={{ background: 'none', border: 'none', fontSize: 12, color: t.fgMuted, cursor: 'pointer', padding: 0 }}>✕</button>
            </div>
            <div style={field}>
              <label style={label}>Raio de busca</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => onRadiusChange(r)}
                    style={{
                      padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      border: `1.5px solid ${radius === r ? t.geo : t.border}`,
                      background: radius === r ? t.geo : t.bgSubtle,
                      color: radius === r ? '#fff' : t.fgMuted,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s',
                    }}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={field}>
        <label style={label}>Busca</label>
        <input style={control} placeholder="Nome ou endereço…" value={filters.search} onChange={(e) => set({ search: e.target.value })} />
      </div>

      <div style={field}>
        <label style={label}>Estado</label>
        <select style={control} value={filters.state} onChange={(e) => set({ state: e.target.value, city: '' })}>
          <option value="">Todos</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={field}>
        <label style={label}>Cidade</label>
        <select style={control} value={filters.city} onChange={(e) => set({ city: e.target.value })} disabled={!cities.length}>
          <option value="">Todas</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

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
                    fontFamily: 'inherit', fontWeight: active ? 600 : 400, transition: 'all .12s',
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

const MAP_CENTER = { lat: -15.7942, lng: -47.8825 }

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PublicMapPage() {
  const { token } = useParams<{ token: string }>()
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: MAPS_API_KEY, id: 'google-map-script' })
  const mapRef = useRef<google.maps.Map | null>(null)
  const hasInitialFit = useRef(false)

  const [allPins, setAllPins] = useState<MapPin[]>([])
  const [pinTypes, setPinTypes] = useState<{ id: string; name: string; color: string }[]>([])
  const [states, setStates] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null)
  const [selectedPinDist, setSelectedPinDist] = useState<number | undefined>()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [error, setError] = useState<'not-found' | 'disabled' | null>(null)
  const [ready, setReady] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  const [filters, setFilters] = useState<Filters>({ state: '', city: '', pinTypeId: '', search: '' })
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [radius, setRadius] = useState(50)
  const [branding, setBranding] = useState<PublicMapBranding | null>(null)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    if (!isMobile) setFiltersOpen(true)
  }, [isMobile])

  useEffect(() => {
    if (!token) return
    Promise.all([
      api.maps.publicPins(token),
      api.maps.publicLocalities(token),
      api.maps.publicPinTypes(token),
      api.maps.publicConfig(token),
    ]).then(([pins, localities, types, config]) => {
      setAllPins(pins)
      setStates(localities.states)
      setCities(localities.cities)
      setPinTypes(types)
      setBranding(config)
      setReady(true)
    }).catch((err) => {
      const status = err?.response?.status
      setError(status === 403 ? 'disabled' : 'not-found')
    })
  }, [token])

  useEffect(() => {
    if (!token || !ready) return
    api.maps.publicLocalities(token, filters.state || undefined).then((l) => setCities(l.cities))
  }, [filters.state, token, ready])

  const filtered = useMemo(() => allPins.filter((p) => {
    if (filters.state && p.state !== filters.state) return false
    if (filters.city && p.city !== filters.city) return false
    if (filters.pinTypeId && p.pinType?.id !== filters.pinTypeId) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !p.address?.toLowerCase().includes(q)) return false
    }
    if (userLocation && p.lat && p.lng) {
      const dist = haversine(userLocation.lat, userLocation.lng, Number(p.lat), Number(p.lng))
      if (dist > radius) return false
    }
    return true
  }), [allPins, filters, userLocation, radius])

  const validPins = useMemo(() => filtered.filter((p) => p.lat && p.lng), [filtered])

  const fitBounds = useCallback((pins: typeof validPins) => {
    const map = mapRef.current
    if (!map || pins.length === 0) return
    const bounds = new google.maps.LatLngBounds()
    pins.forEach((p) => bounds.extend({ lat: Number(p.lat), lng: Number(p.lng) }))
    map.fitBounds(bounds, 48)
    google.maps.event.addListenerOnce(map, 'idle', () => {
      if (map.getZoom()! > 14) map.setZoom(14)
    })
  }, [])

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  const onMapIdle = useCallback(() => {
    setMapReady(true)
  }, [])

  // Initial fit — runs once when pins first load
  useEffect(() => {
    if (hasInitialFit.current || validPins.length === 0 || userLocation) return
    fitBounds(validPins)
    hasInitialFit.current = true
  }, [validPins, fitBounds, userLocation])

  // Re-fit when filters change (after initial fit), skip if user location controls view
  useEffect(() => {
    if (!hasInitialFit.current || userLocation) return
    fitBounds(validPins)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // Pan/zoom to user location
  useEffect(() => {
    if (!mapRef.current || !userLocation) return
    mapRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng })
    mapRef.current.setZoom(getZoomForRadius(radius))
  }, [userLocation, radius])

  const requestGeo = () => {
    if (!navigator.geolocation) { setGeoStatus('unavailable'); return }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoStatus('granted')
      },
      (err) => {
        setGeoStatus(err.code === 1 ? 'denied' : 'unavailable')
      },
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  const clearGeo = (resetStatus = true) => {
    setUserLocation(null)
    if (resetStatus) setGeoStatus('idle')
  }

  const hasActive = filters.state || filters.city || filters.pinTypeId || filters.search || userLocation
  const activeCount = [filters.state, filters.city, filters.pinTypeId, filters.search, userLocation ? '1' : ''].filter(Boolean).length

  if (error === 'disabled') {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0c0c0e',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#fff',
      }}>
        <div style={{ padding: '20px 28px', flexShrink: 0 }}>
          <a href="https://mappahub.com.br" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#4f46e5"/>
              <path d="M16 5C11.582 5 8 8.582 8 13c0 6.222 8 14 8 14s8-7.778 8-14c0-4.418-3.582-8-8-8z" fill="white"/>
              <circle cx="16" cy="13" r="3.2" fill="#4f46e5"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '-0.2px' }}>MappaHub</span>
          </a>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
              <div style={{ position: 'absolute', width: 96, height: 96, background: 'radial-gradient(circle, rgba(79,70,229,0.35) 0%, transparent 70%)', borderRadius: '50%' }}/>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.686 2 6 4.686 6 8c0 4.667 6 12 6 12s6-7.333 6-12c0-3.314-2.686-6-6-6z"/>
                <circle cx="12" cy="8" r="2"/>
                <line x1="2" y1="20" x2="22" y2="20" strokeOpacity=".3"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 10px', letterSpacing: '-0.4px', color: 'rgba(255,255,255,0.92)' }}>
              Este mapa está indisponível
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', margin: '0 0 32px', lineHeight: 1.65 }}>
              O proprietário pausou o acesso público a este mapa.<br/>
              Entre em contato para mais informações.
            </p>
            <a href="https://mappahub.com.br" target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.5)', fontSize: 13,
              textDecoration: 'none', letterSpacing: '-0.1px',
            }}>
              Conheça o MappaHub →
            </a>
          </div>
        </div>

        <div style={{ padding: '16px 28px', textAlign: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.3px' }}>POWERED BY MAPPAHUB</span>
        </div>
      </div>
    )
  }

  if (error === 'not-found') {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        background: '#0c0c0e',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        alignItems: 'center', justifyContent: 'center', color: '#fff',
      }}>
        <div style={{ textAlign: 'center', padding: '0 24px' }}>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ position: 'absolute', width: 96, height: 96, background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', borderRadius: '50%' }}/>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8"  x2="11" y2="14"/><line x1="8"  y1="11" x2="14" y2="11"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 8, letterSpacing: '-0.3px' }}>Mapa não encontrado</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>Verifique o link e tente novamente.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif', background: t.bg, color: t.fg }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: '10px 16px', background: t.bg, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12, boxShadow: t.shadowSm, zIndex: 1000 }}>
        {branding?.brandLogoUrl || branding?.brandName ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
            <a
              href={branding.brandWebsiteUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
            >
              {branding.brandLogoUrl && (
                <img src={branding.brandLogoUrl} alt={branding.brandName ?? 'Logo'} style={{ height: 26, maxWidth: 90, objectFit: 'contain' }} />
              )}
              {branding.brandName && !branding.brandLogoUrl && (
                <span style={{ fontSize: 14, fontWeight: 700, color: branding.brandColor ?? t.accent }}>{branding.brandName}</span>
              )}
            </a>
            {isMobile && (
              <a href="https://mappahub.com.br" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 9, color: t.fgMuted, textDecoration: 'none', letterSpacing: '0.01em', lineHeight: 1 }}>
                powered by <span style={{ fontWeight: 700, color: t.fg }}>MappaHub</span>
              </a>
            )}
          </div>
        ) : (
          <a href="https://mappahub.com.br" target="_blank" rel="noopener noreferrer" title="Powered by MappaHub"
            style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: t.accent, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" fill="white" stroke="none" />
              </svg>
            </div>
            <span style={{ fontSize: 11, color: t.fgMuted, letterSpacing: '0.01em' }}>
              Powered by <span style={{ fontWeight: 700, color: t.fg }}>MappaHub</span>
            </span>
          </a>
        )}

        <div style={{ flex: 1, fontSize: 13, color: t.fgMuted }}>
          <span style={{ fontWeight: 600, color: t.fg }}>{filtered.length}</span>
          {' '}parceiro{filtered.length !== 1 ? 's' : ''}
          {hasActive && allPins.length !== filtered.length && <span> de {allPins.length}</span>}
          {userLocation && <span style={{ color: t.geo, fontWeight: 600 }}> · raio {radius} km</span>}
        </div>

        <button
          onClick={() => {
            setFiltersOpen((v) => {
              if (!v && isMobile) { setSelectedPin(null); setSelectedPinDist(undefined) }
              return !v
            })
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20,
            border: `1.5px solid ${hasActive ? (branding?.brandColor ?? t.accent) : t.border}`,
            background: hasActive ? (branding?.brandColor ?? t.accent) : t.bg,
            color: hasActive ? '#fff' : t.fg,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: hasActive ? `0 2px 8px ${(branding?.brandColor ?? t.accent)}40` : 'none',
            transition: 'all .15s', fontFamily: 'inherit',
          }}
        >
          <FilterIcon />
          {!isMobile && 'Filtros'}
          {activeCount > 0 && (
            <span style={{ background: 'rgba(255,255,255,.25)', color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: 11, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', paddingTop: 46 }}>
        {!isMobile && filtersOpen && (
          <div style={{ width: 260, flexShrink: 0, background: t.bg, borderRight: `1px solid ${t.border}`, overflowY: 'auto', boxShadow: '2px 0 8px rgba(0,0,0,.04)' }}>
            <FilterPanel
              filters={filters} states={states} cities={cities} pinTypes={pinTypes}
              userLocation={userLocation} geoStatus={geoStatus} radius={radius}
              onChange={setFilters} onRequestGeo={requestGeo} onClearGeo={clearGeo} onRadiusChange={setRadius}
              isMobile={false}
            />
          </div>
        )}

        <div style={{ flex: 1, position: 'relative' }}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ position: 'absolute', inset: 0 }}
              center={MAP_CENTER}
              zoom={5}
              options={{
                mapTypeControl: false,
                fullscreenControl: false,
                streetViewControl: false,
                gestureHandling: 'greedy',
              }}
              onLoad={onMapLoad}
              onIdle={onMapIdle}
            >
              {mapReady && <MarkerClusterer
                options={{ zoomOnClick: false }}
                onClick={(cluster) => {
                  const map = mapRef.current
                  if (!map) return
                  map.setZoom(Math.min((map.getZoom() ?? 5) + 3, 16))
                  const center = cluster.getCenter()
                  if (center) map.panTo(center)
                }}
              >
                {(clusterer) => (
                  <>
                    {validPins.map((pin) => (
                      <Marker
                        key={pin.id}
                        position={{ lat: Number(pin.lat), lng: Number(pin.lng) }}
                        title={pin.name}
                        icon={{
                          url: makePinIconUrl(pin.pinType?.color ?? '#4f46e5'),
                          scaledSize: new google.maps.Size(PIN_ICON_SIZE.width, PIN_ICON_SIZE.height),
                          anchor: new google.maps.Point(PIN_ICON_SIZE.width / 2, PIN_ICON_SIZE.height),
                        }}
                        clusterer={clusterer}
                        onClick={() => {
                          const dist = userLocation && pin.lat && pin.lng
                            ? haversine(userLocation.lat, userLocation.lng, Number(pin.lat), Number(pin.lng))
                            : undefined
                          setSelectedPin((prev) => prev?.id === pin.id ? null : pin)
                          setSelectedPinDist(dist)
                        }}
                      />
                    ))}
                    {userLocation && (
                      <Marker
                        position={userLocation}
                        icon={{
                          path: google.maps.SymbolPath.CIRCLE,
                          scale: 10,
                          fillColor: t.geo,
                          fillOpacity: 1,
                          strokeColor: '#fff',
                          strokeWeight: 3,
                        }}
                        zIndex={1000}
                      />
                    )}
                  </>
                )}
              </MarkerClusterer>}
              {userLocation && (
                <Circle
                  center={userLocation}
                  radius={radius * 1000}
                  options={{
                    strokeColor: t.geo,
                    strokeOpacity: 0.7,
                    strokeWeight: 1.5,
                    fillColor: t.geo,
                    fillOpacity: 0.06,
                  }}
                />
              )}
            </GoogleMap>
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: t.bg, gap: 12 }}>
              <div style={{ width: 36, height: 36, border: `3px solid ${t.border}`, borderTopColor: t.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: 13, color: t.fgMuted }}>Carregando mapa…</div>
            </div>
          )}
          {!ready && isLoaded && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: t.bg, gap: 12 }}>
              <div style={{ width: 36, height: 36, border: `3px solid ${t.border}`, borderTopColor: t.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: 13, color: t.fgMuted }}>Carregando mapa…</div>
            </div>
          )}
          {selectedPin && <InfoPopup pin={selectedPin} distance={selectedPinDist} onClose={() => { setSelectedPin(null); setSelectedPinDist(undefined) }} />}
        </div>
      </div>

      {/* Footer */}
      {branding?.brandFooterText && (
        <div style={{ flexShrink: 0, padding: '6px 16px', background: t.bg, borderTop: `1px solid ${t.border}`, textAlign: 'center', fontSize: 11, color: t.fgMuted }}>
          {branding.brandFooterText}
        </div>
      )}

      {/* Powered by MappaHub — desktop only */}
      <a
        href="https://mappahub.com.br"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: isMobile ? 'none' : 'flex',
          position: 'fixed', bottom: 12, right: 12, zIndex: 900,
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 8px 4px 6px', borderRadius: 20,
          background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(6px)',
          boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
          textDecoration: 'none', border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ width: 16, height: 16, borderRadius: 4, background: t.accent, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" fill="white" stroke="none" />
          </svg>
        </div>
        <span style={{ fontSize: 10, color: '#6b7280', letterSpacing: '0.01em', fontFamily: 'system-ui, sans-serif' }}>
          Powered by <span style={{ fontWeight: 700, color: '#111827' }}>MappaHub</span>
        </span>
      </a>

      {/* Mobile bottom sheet */}
      {isMobile && filtersOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500 }}>
          <div onClick={() => setFiltersOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: t.bg, borderRadius: '18px 18px 0 0', boxShadow: '0 -4px 32px rgba(0,0,0,.18)', maxHeight: '78vh', overflowY: 'auto', padding: '10px 20px 0' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: t.border, margin: '0 auto 14px' }} />
            <FilterPanel
              filters={filters} states={states} cities={cities} pinTypes={pinTypes}
              userLocation={userLocation} geoStatus={geoStatus} radius={radius}
              onChange={setFilters} onRequestGeo={requestGeo} onClearGeo={clearGeo} onRadiusChange={setRadius}
              onClose={() => setFiltersOpen(false)} isMobile={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function getZoomForRadius(km: number): number {
  if (km <= 10) return 13
  if (km <= 25) return 11
  if (km <= 50) return 10
  if (km <= 100) return 9
  return 8
}
