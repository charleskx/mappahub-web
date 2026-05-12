import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import type { MapPin } from '../../types'

declare global {
  interface Window {
    initPublicMap: () => void
  }
}

function loadMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return }
    window.initPublicMap = resolve
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initPublicMap&libraries=marker&loading=async`
    script.async = true
    script.defer = true
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default function PublicMapPage() {
  const { token } = useParams<{ token: string }>()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const markers = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const [pins, setPins] = useState<MapPin[]>([])
  const [error, setError] = useState('')
  const [mapsReady, setMapsReady] = useState(false)
  const [mapMounted, setMapMounted] = useState(false)

  useEffect(() => {
    if (!token) return
    Promise.all([
      api.maps.publicConfig(token),
      api.maps.publicPins(token),
    ])
      .then(([config, p]) => {
        if (!config.googleMapsApiKey) {
          setError('Chave do Google Maps não configurada.')
          return
        }
        setPins(p)
        return loadMapsScript(config.googleMapsApiKey)
      })
      .then((result) => {
        if (result !== undefined) setMapsReady(true)
      })
      .catch(() => setError('Mapa não encontrado ou acesso negado.'))
  }, [token])

  useEffect(() => {
    if (!mapsReady || !mapRef.current) return
    try {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: { lat: -15.7942, lng: -47.8825 },
        zoom: 5,
        mapId: 'atlasync-public-map',
      })
      setMapMounted(true)
    } catch {
      setError('Erro ao inicializar o mapa.')
    }
  }, [mapsReady])

  useEffect(() => {
    if (!mapMounted || !mapInstance.current || !pins.length) return
    markers.current.forEach((m) => { m.map = null })
    markers.current = []

    const bounds = new google.maps.LatLngBounds()
    let hasValidPin = false

    pins.forEach((pin) => {
      if (!pin.lat || !pin.lng) return
      try {
        const el = document.createElement('div')
        el.style.cssText = `width:12px;height:12px;border-radius:50%;background:${pin.pinType?.color ?? '#f59e0b'};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)`

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapInstance.current!,
          position: { lat: Number(pin.lat), lng: Number(pin.lng) },
          content: el,
          title: pin.name,
        })
        bounds.extend({ lat: Number(pin.lat), lng: Number(pin.lng) })
        markers.current.push(marker)
        hasValidPin = true
      } catch {
        // skip pins that fail to mount
      }
    })

    if (hasValidPin) mapInstance.current?.fitBounds(bounds)
  }, [pins, mapMounted])

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🗺️</div>
          <div className="h2">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 20px', background: 'var(--bg-elev)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="sidebar-mark" style={{ width: 28, height: 28 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" />
            <circle cx="12" cy="9" r="2.5" fill="currentColor" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>atlasync</div>
          <div className="muted text-sm">{pins.length} parceiro{pins.length !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {!mapsReady && !error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
            <div className="muted">Carregando mapa…</div>
          </div>
        )}
      </div>
    </div>
  )
}
