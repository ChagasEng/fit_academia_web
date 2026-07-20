let loader

export function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (loader) return loader

  const key = window.__APP_CONFIG__?.googleMapsApiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) return Promise.reject(new Error('A chave do Google Maps não está configurada.'))

  loader = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`
    script.async = true
    script.onload = () => window.google?.maps ? resolve(window.google.maps) : reject(new Error('O Google Maps não respondeu corretamente.'))
    script.onerror = () => reject(new Error('Não foi possível carregar o Google Maps. Confira se a Maps JavaScript API está habilitada.'))
    document.head.appendChild(script)
  })

  return loader
}
