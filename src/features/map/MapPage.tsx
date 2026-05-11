import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Badge, Button, Card } from '../../components/ui'
import { I } from '../../components/icons'
import type { MapPin } from '../../types'

declare global {
  interface Window {
    initMap: () => void
  }
}

function loadMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return }
    window.initMap = resolve
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=marker`
    script.async = true
    script.onerror = reject
    document.head.appendChild(script)
  })
}

interface InfoPopupProps {
  pin: MapPin
  onClose: () => void
}

function InfoPopup({ pin, onClose }: InfoPopupProps) {
  return (
    <Card
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 280,
        zIndex: 10,
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 600 }}>{pin.name}</div>
        <button className="icon-btn" onClick={onClose}><I.x size={14} /></button>
      </div>
      {pin.address && <div className="muted text-sm" style={{ marginTop: 4 }}>{pin.address}</div>}
      {pin.city && (
        <div className="muted text-sm">{[pin.city, pin.state].filter(Boolean).join(' / ')}</div>
      )}
      {pin.email && (
        <div style={{ marginTop: 8, fontSize: 13 }}>
          <a href={`mailto:${pin.email}`} className="link">{pin.email}</a>
        </div>
      )}
      {pin.phone && <div style={{ fontSize: 13, marginTop: 4 }}>{pin.phone}</div>}
      {pin.pinTypeName && (
        <Badge style={{ marginTop: 8, background: (pin.pinTypeColor ?? '#888') + '22', color: pin.pinTypeColor ?? undefined }}>
          {pin.pinTypeName}
        </Badge>
      )}
    </Card>
  )
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const markers = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const [mapsError, setMapsError] = useState(false)

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
  })

  const { data: pins } = useQuery({
    queryKey: ['mapPins'],
    queryFn: () => api.maps.pins(),
    enabled: mapsReady,
  })

  useEffect(() => {
    if (!settings?.mapsKey) return
    loadMapsScript(settings.mapsKey)
      .then(() => setMapsReady(true))
      .catch(() => setMapsError(true))
  }, [settings?.mapsKey])

  useEffect(() => {
    if (!mapsReady || !mapRef.current) return
    mapInstance.current = new google.maps.Map(mapRef.current, {
      center: { lat: -15.7942, lng: -47.8825 },
      zoom: 5,
      mapId: 'atlasync-map',
      disableDefaultUI: false,
    })
  }, [mapsReady])

  useEffect(() => {
    if (!mapInstance.current || !pins) return
    markers.current.forEach((m) => { m.map = null })
    markers.current = []

    pins.forEach((pin) => {
      if (!pin.lat || !pin.lng) return
      const el = document.createElement('div')
      el.style.cssText = `width:12px;height:12px;border-radius:50%;background:${pin.pinTypeColor ?? '#f59e0b'};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:pointer`

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance.current!,
        position: { lat: Number(pin.lat), lng: Number(pin.lng) },
        content: el,
        title: pin.name,
      })
      marker.addListener('click', () => setSelectedPin(pin))
      markers.current.push(marker)
    })
  }, [pins])

  if (!settings?.mapsKey) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h1 className="h1">Mapa interno</h1>
          <p className="muted text-sm">Visualize seus parceiros no mapa</p>
        </div>
        <Card style={{ padding: 48, textAlign: 'center' }}>
          <I.key size={32} style={{ color: 'var(--amber)', marginBottom: 16 }} />
          <div className="h2" style={{ marginBottom: 8 }}>Google Maps API Key necessária</div>
          <div className="muted text-sm" style={{ marginBottom: 24 }}>
            Configure sua API Key nas configurações do workspace para usar o mapa.
          </div>
          <Button variant="primary" leftIcon={<I.settings size={14} />} onClick={() => window.location.href = '/settings'}>
            Ir para Configurações
          </Button>
        </Card>
      </div>
    )
  }

  if (mapsError) {
    return (
      <div>
        <h1 className="h1">Mapa interno</h1>
        <Card style={{ padding: 48, textAlign: 'center', marginTop: 24 }}>
          <I.alert size={32} style={{ color: 'var(--danger)', marginBottom: 16 }} />
          <div className="h2">Erro ao carregar o mapa</div>
          <div className="muted text-sm">Verifique sua Google Maps API Key nas configurações.</div>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="h1">Mapa interno</h1>
          <p className="muted text-sm">{pins?.length ?? 0} parceiro{pins?.length !== 1 ? 's' : ''} no mapa</p>
        </div>
      </div>
      <div style={{ position: 'relative', flex: 1, minHeight: 500, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {!mapsReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)' }}>
            <div className="muted">Carregando mapa…</div>
          </div>
        )}
        {selectedPin && <InfoPopup pin={selectedPin} onClose={() => setSelectedPin(null)} />}
      </div>
    </div>
  )
}
