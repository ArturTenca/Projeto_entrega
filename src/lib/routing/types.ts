export type LatLng = {
  lat: number
  lng: number
}

export type RouteStop = LatLng & {
  id: string
  nome: string
  endereco: string | null
  ordem: number
}

export type RouteResult = {
  stops: RouteStop[]
  polyline: LatLng[]
  distanceMeters: number
  durationSeconds: number
  provider: 'google' | 'openrouteservice' | 'estimativa'
  trafficAware: boolean
}

export type CondominioRouteInput = {
  id: string
  nome: string
  endereco: string | null
  latitude: number | null
  longitude: number | null
}
