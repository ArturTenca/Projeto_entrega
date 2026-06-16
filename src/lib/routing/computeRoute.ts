import { supabase } from '@/lib/supabase'
import { geocodeAddress, geocodeWithOpenRouteService } from './geocode'
import { routeWithEstimativa, routeWithGoogleMaps } from './googleRoutes'
import { routeWithOpenRouteService } from './openRouteService'
import type { CondominioRouteInput, LatLng, RouteResult } from './types'

async function resolveCoordinates(
  condominios: CondominioRouteInput[],
): Promise<Map<string, LatLng>> {
  const coordinates = new Map<string, LatLng>()
  const orsKey = import.meta.env.VITE_ORS_API_KEY

  for (const condominio of condominios) {
    if (condominio.latitude !== null && condominio.longitude !== null) {
      coordinates.set(condominio.id, {
        lat: condominio.latitude,
        lng: condominio.longitude,
      })
      continue
    }

    if (!condominio.endereco?.trim()) {
      continue
    }

    const searchText = `${condominio.nome}, ${condominio.endereco}`

    const geocoded = orsKey
      ? await geocodeWithOpenRouteService(searchText, orsKey)
      : await geocodeAddress(searchText)

    if (!geocoded) {
      continue
    }

    coordinates.set(condominio.id, geocoded)

    await supabase
      .from('condominios')
      .update({
        latitude: geocoded.lat,
        longitude: geocoded.lng,
      })
      .eq('id', condominio.id)
  }

  return coordinates
}

export async function computeDeliveryRoute(
  condominios: CondominioRouteInput[],
): Promise<{
  route: RouteResult | null
  missingCoordinates: string[]
}> {
  const uniqueCondominios = Array.from(
    new Map(condominios.map((item) => [item.id, item])).values(),
  )

  const coordinates = await resolveCoordinates(uniqueCondominios)

  const missingCoordinates = uniqueCondominios
    .filter((condominio) => !coordinates.has(condominio.id))
    .map((condominio) => condominio.nome)

  if (coordinates.size === 0) {
    return { route: null, missingCoordinates }
  }

  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const orsKey = import.meta.env.VITE_ORS_API_KEY

  let route: RouteResult | null = null

  if (googleKey) {
    route = await routeWithGoogleMaps(googleKey, uniqueCondominios, coordinates)
  }

  if (!route && orsKey) {
    route = await routeWithOpenRouteService(
      orsKey,
      uniqueCondominios,
      coordinates,
    )
  }

  if (!route) {
    route = routeWithEstimativa(uniqueCondominios, coordinates)
  }

  return { route, missingCoordinates }
}
