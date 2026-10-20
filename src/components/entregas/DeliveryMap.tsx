import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '@/features/theme/ThemeProvider'
import type { RouteResult } from '@/lib/routing/types'

function createStopIcon(ordem: number, dimmed: boolean) {
  return L.divIcon({
    className: 'delivery-map-marker',
    html: `<span class="delivery-map-marker-dot${dimmed ? ' is-dimmed' : ''}">${ordem}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

function FitBounds({
  route,
  selectedStopId,
}: {
  route: RouteResult
  selectedStopId?: string | null
}) {
  const map = useMap()

  useEffect(() => {
    if (route.stops.length === 0) return

    const selected = route.stops.find((stop) => stop.id === selectedStopId)

    if (selected) {
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 15), {
        duration: 0.35,
      })
      return
    }

    const bounds = L.latLngBounds(
      route.stops.map((stop) => [stop.lat, stop.lng] as [number, number]),
    )

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }, [map, route, selectedStopId])

  return null
}

interface DeliveryMapProps {
  route: RouteResult | null
  selectedStopId?: string | null
}

export function DeliveryMap({ route, selectedStopId }: DeliveryMapProps) {
  const { theme } = useTheme()

  // Tiles do OpenStreetMap: grátis e sem chave. O modo escuro é feito por filtro CSS (index.css).
  const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

  const lineColor = theme === 'dark' ? '#f54b2e' : '#f54b2e'

  const icons = useMemo(() => {
    const map = new Map<string, L.DivIcon>()

    if (!route) return map

    for (const stop of route.stops) {
      const dimmed = Boolean(selectedStopId && selectedStopId !== stop.id)
      map.set(stop.id, createStopIcon(stop.ordem, dimmed))
    }

    return map
  }, [route, selectedStopId])

  if (!route || route.stops.length === 0) {
    return (
      <div className="delivery-map relative z-0 flex h-72 items-center justify-center overflow-hidden border-y border-border bg-background">
        <p className="text-sm text-muted">Mapa indisponível sem coordenadas.</p>
      </div>
    )
  }

  const center = route.stops[0]!

  return (
    <div className="delivery-map relative z-0 h-80 w-full overflow-hidden border-y border-border bg-background">
      <MapContainer
        key={theme}
        center={[center.lat, center.lng]}
        zoom={13}
        className="h-full w-full bg-background"
        scrollWheelZoom={false}
        attributionControl
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
          url={tileUrl}
        />
        <FitBounds route={route} selectedStopId={selectedStopId} />
        <Polyline
          positions={route.polyline.map((point) => [point.lat, point.lng])}
          pathOptions={{
            color: lineColor,
            weight: 3,
            opacity: 0.7,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
        {route.stops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={icons.get(stop.id)}
            zIndexOffset={selectedStopId === stop.id ? 200 : 0}
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
    </div>
  )
}
