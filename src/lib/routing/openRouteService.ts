import {
  estimateRouteMetrics,
  nearestNeighborOrder,
} from './distance'
import type { CondominioRouteInput, LatLng, RouteResult } from './types'

type OrsDirectionsResponse = {
  routes?: Array<{
    summary: { distance: number; duration: number }
    geometry: string
  }>
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

async function optimizeOrder(
  apiKey: string,
  points: Array<LatLng & { id: string }>,
): Promise<string[] | null> {
  if (points.length <= 1) {
    return points.map((point) => point.id)
  }

  const response = await fetch(
    'https://api.openrouteservice.org/optimization',
    {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobs: points.map((point, index) => ({
          id: index + 1,
          location: [point.lng, point.lat],
        })),
        vehicles: [
          {
            id: 1,
            profile: 1,
            start: [points[0]!.lng, points[0]!.lat],
            end: [points[0]!.lng, points[0]!.lat],
          },
        ],
      }),
    },
  )

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as {
    routes?: Array<{ steps?: Array<{ job?: number }> }>
  }

  const steps = data.routes?.[0]?.steps?.filter((step) => step.job)

  if (!steps?.length) {
    return null
  }

  return steps
    .map((step) => points[(step.job ?? 1) - 1]?.id)
    .filter((id): id is string => Boolean(id))
}

export async function routeWithOpenRouteService(
  apiKey: string,
  condominios: CondominioRouteInput[],
  coordinates: Map<string, LatLng>,
): Promise<RouteResult | null> {
  const points = condominios
    .map((condominio) => {
      const coords = coordinates.get(condominio.id)
      if (!coords) return null
      return { id: condominio.id, nome: condominio.nome, ...coords }
    })
    .filter((point): point is LatLng & { id: string; nome: string } =>
      Boolean(point),
    )

  if (points.length === 0) {
    return null
  }

  const optimizedIds =
    (await optimizeOrder(apiKey, points)) ?? nearestNeighborOrder(points)

  const orderedPoints = optimizedIds
    .map((id) => {
      const point = points.find((item) => item.id === id)
      const condominio = condominios.find((item) => item.id === id)
      if (!point || !condominio) return null
      return { ...point, condominio }
    })
    .filter(Boolean) as Array<LatLng & { id: string; nome: string; condominio: CondominioRouteInput }>

  const coordinateString = orderedPoints
    .map((point) => `${point.lng},${point.lat}`)
    .join('|')

  const directionsResponse = await fetch(
    `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&coordinates=${coordinateString}&geometry_format=encodedpolyline`,
  )

  if (!directionsResponse.ok) {
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

  const directions = (await directionsResponse.json()) as OrsDirectionsResponse
  const route = directions.routes?.[0]

  if (!route) {
    return null
  }

  return {
    stops: orderedPoints.map((point, index) => ({
      id: point.id,
      nome: point.nome,
      endereco: point.condominio.endereco,
      lat: point.lat,
      lng: point.lng,
      ordem: index + 1,
    })),
    polyline: decodePolyline(route.geometry),
    distanceMeters: route.summary.distance,
    durationSeconds: route.summary.duration,
    provider: 'openrouteservice',
    trafficAware: false,
  }
}
