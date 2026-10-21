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
  provider: 'osrm' | 'estimativa'
}

export type CondominioRouteInput = {
  id: string
  nome: string
  endereco: string | null
  latitude: number | null
  longitude: number | null
}
