export function openInWaze(lat: number, lng: number): void {
  const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function openInGoogleMaps(lat: number, lng: number): void {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
  window.open(url, '_blank', 'noopener,noreferrer')
}
