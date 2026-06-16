import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import type { RouteResult } from '@/lib/routing/types'
import { Card } from '@/components/ui/Card'

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

L.Marker.prototype.options.icon = defaultIcon

function FitBounds({ route }: { route: RouteResult }) {
  const map = useMap()

  useEffect(() => {
    if (route.stops.length === 0) return

    const bounds = L.latLngBounds(
      route.stops.map((stop) => [stop.lat, stop.lng] as [number, number]),
    )

    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 })
  }, [map, route])

  return null
}

interface DeliveryMapProps {
  route: RouteResult | null
  selectedStopId?: string | null
}

export function DeliveryMap({ route, selectedStopId }: DeliveryMapProps) {
  if (!route || route.stops.length === 0) {
    return (
      <Card className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted">Mapa indisponível sem coordenadas.</p>
      </Card>
    )
  }

  const center = route.stops[0]!

  return (
    <Card className="overflow-hidden p-0">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        className="h-72 w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds route={route} />
        <Polyline
          positions={route.polyline.map((point) => [point.lat, point.lng])}
          pathOptions={{ color: '#F54B2E', weight: 4, opacity: 0.85 }}
        />
        {route.stops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            opacity={selectedStopId && selectedStopId !== stop.id ? 0.5 : 1}
          >
            <Popup>
              <strong>
                {stop.ordem}. {stop.nome}
              </strong>
              {stop.endereco ? <div>{stop.endereco}</div> : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Card>
  )
}
