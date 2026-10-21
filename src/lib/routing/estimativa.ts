import {
  estimateRouteMetrics,
  nearestNeighborOrder,
} from './distance'
import type { CondominioRouteInput, LatLng, RouteResult } from './types'

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
  }
}
