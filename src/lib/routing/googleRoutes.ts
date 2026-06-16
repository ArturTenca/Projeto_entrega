import {
  estimateRouteMetrics,
  nearestNeighborOrder,
} from './distance'
import type { CondominioRouteInput, LatLng, RouteResult } from './types'

type GoogleRoutesResponse = {
  routes?: Array<{
    distanceMeters: number
    duration: string
    polyline?: { encodedPolyline: string }
    optimizedIntermediateWaypointIndex?: number[]
  }>
}

function decodeGooglePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte = 0

    do {
      byte = encoded.charCodeAt(index++) - 31
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1
    lat += deltaLat

    shift = 0
    result = 0

    do {
      byte = encoded.charCodeAt(index++) - 31
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1
    lng += deltaLng

    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }

  return points
}

function parseDurationSeconds(duration: string): number {
  const match = duration.match(/(\d+)s/)
  return match ? Number.parseInt(match[1]!, 10) : 0
}

export async function routeWithGoogleMaps(
  apiKey: string,
  condominios: CondominioRouteInput[],
  coordinates: Map<string, LatLng>,
): Promise<RouteResult | null> {
  const points = condominios
    .map((condominio) => {
      const coords = coordinates.get(condominio.id)
      if (!coords) return null
      return { ...condominio, ...coords }
    })
    .filter(
      (
        point,
      ): point is CondominioRouteInput & LatLng & { nome: string } =>
        Boolean(point),
    )

  if (points.length === 0) {
    return null
  }

  const origin = points[0]!
  const destination = points[points.length - 1]!
  const intermediates =
    points.length > 2
      ? points.slice(1, -1).map((point) => ({
          location: {
            latLng: { latitude: point.lat, longitude: point.lng },
          },
        }))
      : []

  const response = await fetch(
    'https://routes.googleapis.com/directions/v2:computeRoutes',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.optimizedIntermediateWaypointIndex',
      },
      body: JSON.stringify({
        origin: {
          location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
        },
        destination: {
          location: {
            latLng: { latitude: destination.lat, longitude: destination.lng },
          },
        },
        intermediates,
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        optimizeWaypointOrder: intermediates.length > 0,
        departureTime: new Date().toISOString(),
      }),
    },
  )

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as GoogleRoutesResponse
  const route = data.routes?.[0]

  if (!route) {
    return null
  }

  let orderedPoints = points

  if (route.optimizedIntermediateWaypointIndex?.length) {
    const middle = points.slice(1, -1)
    const optimizedMiddle = route.optimizedIntermediateWaypointIndex.map(
      (index) => middle[index]!,
    )
    orderedPoints = [origin, ...optimizedMiddle, destination]
  } else if (points.length > 2) {
    const ids = nearestNeighborOrder(
      points.map((point) => ({
        id: point.id,
        lat: point.lat,
        lng: point.lng,
      })),
    )
    orderedPoints = ids
      .map((id) => points.find((point) => point.id === id)!)
      .filter(Boolean)
  }

  const polyline = route.polyline?.encodedPolyline
    ? decodeGooglePolyline(route.polyline.encodedPolyline)
    : orderedPoints

  return {
    stops: orderedPoints.map((point, index) => ({
      id: point.id,
      nome: point.nome,
      endereco: point.endereco,
      lat: point.lat,
      lng: point.lng,
      ordem: index + 1,
    })),
    polyline,
    distanceMeters: route.distanceMeters,
    durationSeconds: parseDurationSeconds(route.duration),
    provider: 'google',
    trafficAware: true,
  }
}

export function routeWithEstimativa(
  condominios: CondominioRouteInput[],
  coordinates: Map<string, LatLng>,
): RouteResult | null {
  const points = condominios
    .map((condominio) => {
      const coords = coordinates.get(condominio.id)
      if (!coords) return null
      return { id: condominio.id, nome: condominio.nome, condominio, ...coords }
    })
    .filter(Boolean) as Array<
    LatLng & { id: string; nome: string; condominio: CondominioRouteInput }
  >

  if (points.length === 0) {
    return null
  }

  const orderedIds = nearestNeighborOrder(points)
  const orderedPoints = orderedIds
    .map((id) => points.find((point) => point.id === id)!)
    .filter(Boolean)

  const metrics = estimateRouteMetrics(orderedPoints)

  return {
    stops: orderedPoints.map((point, index) => ({
      id: point.id,
      nome: point.nome,
      endereco: point.condominio.endereco,
      lat: point.lat,
      lng: point.lng,
      ordem: index + 1,
    })),
    polyline: orderedPoints,
    distanceMeters: metrics.distanceMeters,
    durationSeconds: metrics.durationSeconds,
    provider: 'estimativa',
    trafficAware: false,
  }
}
