import type { LatLng } from './types'

const EARTH_RADIUS_M = 6_371_000

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }

  return `${(meters / 1000).toFixed(1)} km`
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest > 0 ? `${hours}h ${rest}min` : `${hours}h`
}

export function nearestNeighborOrder(
  points: Array<LatLng & { id: string }>,
): string[] {
  if (points.length <= 1) {
    return points.map((point) => point.id)
  }

  const remaining = [...points]
  const ordered: string[] = []
  let current = remaining.shift()!

  ordered.push(current.id)

  while (remaining.length > 0) {
    let nearestIndex = 0
    let nearestDistance = haversineMeters(current, remaining[0]!)

    for (let index = 1; index < remaining.length; index += 1) {
      const distance = haversineMeters(current, remaining[index]!)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    }

    current = remaining.splice(nearestIndex, 1)[0]!
    ordered.push(current.id)
  }

  return ordered
}

export function estimateRouteMetrics(
  orderedPoints: LatLng[],
): { distanceMeters: number; durationSeconds: number } {
  let distanceMeters = 0

  for (let index = 1; index < orderedPoints.length; index += 1) {
    distanceMeters += haversineMeters(
      orderedPoints[index - 1]!,
      orderedPoints[index]!,
    )
  }

  const durationSeconds = (distanceMeters / 1000 / 30) * 3600

  return { distanceMeters, durationSeconds }
}
