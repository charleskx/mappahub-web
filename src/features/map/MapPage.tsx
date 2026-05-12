import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import L from 'leaflet'
import { api } from '../../lib/api'
import { Badge, Button, Card, Select } from '../../components/ui'
import { I } from '../../components/icons'
import type { MapPin } from '../../types'

function makePinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
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
        zIndex: 1000,
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
      {pin.pinType && (
        <Badge style={{ marginTop: 8, background: (pin.pinType.color ?? '#888') + '22', color: pin.pinType.color ?? undefined }}>
          {pin.pinType.name}
        </Badge>
      )}
    </Card>
  )
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersLayer = useRef<L.LayerGroup | null>(null)
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null)
  const [selectedMapId, setSelectedMapId] = useState<string>('')

  const { data: maps } = useQuery({
    queryKey: ['maps'],
    queryFn: () => api.maps.list(),
  })

  useEffect(() => {
    if (maps?.length && !selectedMapId) {
      setSelectedMapId(maps[0].id)
    }
  }, [maps, selectedMapId])

  const { data: pins } = useQuery({
    queryKey: ['mapPins', selectedMapId],
    queryFn: () => api.maps.pins(selectedMapId),
    enabled: !!selectedMapId,
  })

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    mapInstance.current = L.map(mapRef.current, {
      center: [-15.7942, -47.8825],
      zoom: 5,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstance.current)
    markersLayer.current = L.layerGroup().addTo(mapInstance.current)
  }, [])

  // Update markers when pins change
  useEffect(() => {
    if (!markersLayer.current) return
    markersLayer.current.clearLayers()
    if (!pins?.length) return

    pins.forEach((pin) => {
      if (!pin.lat || !pin.lng) return
      const color = pin.pinType?.color ?? '#f59e0b'
      const marker = L.marker([Number(pin.lat), Number(pin.lng)], {
        icon: makePinIcon(color),
        title: pin.name,
      })
      marker.on('click', () => setSelectedPin(pin))
      markersLayer.current!.addLayer(marker)
    })

    // Fit bounds if there are valid pins
    const validPins = pins.filter((p) => p.lat && p.lng)
    if (validPins.length > 0) {
      const bounds = L.latLngBounds(validPins.map((p) => [Number(p.lat), Number(p.lng)]))
      mapInstance.current?.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    }
  }, [pins])

  return (
    <div className="page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="h1">Mapa interno</h1>
          <div className="muted text-sm">{pins?.length ?? 0} parceiro{pins?.length !== 1 ? 's' : ''} no mapa</div>
        </div>
        {maps && maps.length > 1 && (
          <div className="page-actions">
            <Select value={selectedMapId} onChange={(e) => setSelectedMapId(e.target.value)} style={{ width: 200 }}>
              {maps.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: 500, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {selectedPin && <InfoPopup pin={selectedPin} onClose={() => setSelectedPin(null)} />}
      </div>
    </div>
  )
}
