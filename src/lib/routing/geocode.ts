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
    countrycodes: 'br',
    addressdetails: '1',
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

export async function geocodeByCep(cep: string): Promise<LatLng | null> {
  const digits = cep.replace(/\D/g, '')

  if (digits.length !== 8) {
    return null
  }

  const params = new URLSearchParams({
    postalcode: digits,
    country: 'Brazil',
    format: 'json',
    limit: '1',
    countrycodes: 'br',
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
