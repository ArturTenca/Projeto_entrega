import type { LatLng } from './types'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export async function geocodeAddress(
  address: string,
): Promise<LatLng | null> {
  const query = address.trim()

  if (!query) {
    return null
  }

  const params = new URLSearchParams({
    q: `${query}, Brasil`,
    format: 'json',
    limit: '1',
  })

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'pt-BR',
    },
  })

  if (!response.ok) {
    return null
  }

  const results = (await response.json()) as Array<{
    lat: string
    lon: string
  }>

  const first = results[0]

  if (!first) {
    return null
  }

  return {
    lat: Number.parseFloat(first.lat),
    lng: Number.parseFloat(first.lon),
  }
}

export async function geocodeWithOpenRouteService(
  address: string,
  apiKey: string,
): Promise<LatLng | null> {
  const response = await fetch(
    `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}&boundary.country=BRA&size=1`,
  )

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as {
    features?: Array<{ geometry: { coordinates: [number, number] } }>
  }

  const coordinates = data.features?.[0]?.geometry.coordinates

  if (!coordinates) {
    return null
  }

  return { lat: coordinates[1], lng: coordinates[0] }
}
