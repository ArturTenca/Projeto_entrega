import type { CondominioRouteInput, LatLng, RouteResult } from './types'

// Servidor público do OSRM (open source, grátis, sem chave). Política de uso justo:
// https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server
const OSRM_URL = 'https://router.project-osrm.org'

type OsrmTripResponse = {
  code: string
  trips?: Array<{
    distance: number
    duration: number
    geometry: string
  }>
  waypoints?: Array<{ waypoint_index: number }>
}

function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1
    lat += deltaLat

    shift = 0
    result = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1
    lng += deltaLng

    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }

  return points
}

export async function routeWithOsrm(
  condominios: CondominioRouteInput[],
  coordinates: Map<string, LatLng>,
): Promise<RouteResult | null> {
  const points = condominios
    .map((condominio) => {
      const coords = coordinates.get(condominio.id)
      if (!coords) return null
      return { condominio, ...coords }
    })
    .filter(Boolean) as Array<LatLng & { condominio: CondominioRouteInput }>

  if (points.length === 0) {
    return null
  }

  // Com um único ponto não há rota a calcular.
  if (points.length === 1) {
    const [point] = points
    return {
      stops: [
        {
          id: point!.condominio.id,
          nome: point!.condominio.nome,
          endereco: point!.condominio.endereco,
          lat: point!.lat,
          lng: point!.lng,
          ordem: 1,
        },
      ],
      polyline: [point!],
      distanceMeters: 0,
      durationSeconds: 0,
      provider: 'osrm',
    }
  }

  const coordinateString = points
    .map((point) => `${point.lng},${point.lat}`)
    .join(';')

  const params = new URLSearchParams({
    source: 'first',
    destination: 'any',
    roundtrip: 'false',
    overview: 'full',
    geometries: 'polyline',
  })

  let data: OsrmTripResponse

  try {
    const response = await fetch(
      `${OSRM_URL}/trip/v1/driving/${coordinateString}?${params.toString()}`,
    )

    if (!response.ok) {
      return null
    }

    data = (await response.json()) as OsrmTripResponse
  } catch {
    return null
  }

  const trip = data.trips?.[0]

  if (data.code !== 'Ok' || !trip || !data.waypoints) {
    return null
  }

  // waypoints[i].waypoint_index = posição do ponto i na viagem otimizada.
  const orderedPoints = new Array<(typeof points)[number]>(points.length)
  data.waypoints.forEach((waypoint, index) => {
    orderedPoints[waypoint.waypoint_index] = points[index]!
  })

  return {
    stops: orderedPoints.map((point, index) => ({
      id: point.condominio.id,
      nome: point.condominio.nome,
      endereco: point.condominio.endereco,
      lat: point.lat,
      lng: point.lng,
      ordem: index + 1,
    })),
    polyline: decodePolyline(trip.geometry),
    distanceMeters: trip.distance,
    durationSeconds: trip.duration,
    provider: 'osrm',
  }
}
