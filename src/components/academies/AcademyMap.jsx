import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

export default function AcademyMap({ academies, selectedId, onSelect, className = '' }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined

    let resizeObserver
    try {
      const map = L.map(containerRef.current, { zoomControl: true }).setView([-25.0945, -50.1633], 13)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)
      mapRef.current = map
      layerRef.current = L.layerGroup().addTo(map)
      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(() => map.invalidateSize({ animate: false }))
        resizeObserver.observe(containerRef.current)
      }
      map.whenReady(() => window.setTimeout(() => map.invalidateSize({ animate: false }), 120))
    } catch {
      setMapError(true)
    }

    return () => {
      resizeObserver?.disconnect()
      mapRef.current?.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return

    layer.clearLayers()
    const points = []

    academies.forEach((academy) => {
      const point = [Number(academy.latitude), Number(academy.longitude)]
      if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) return

      points.push(point)
      const selected = Number(selectedId) === Number(academy.id)
      const icon = L.divIcon({
        className: '',
        html: `<span class="academy-map-marker${selected ? ' selected' : ''}" aria-hidden="true"><b>${academy.students_count || 0}</b></span>`,
        iconSize: [34, 42],
        iconAnchor: [17, 40],
      })
      L.marker(point, { icon, title: academy.nome })
        .bindTooltip(academy.nome, { direction: 'top', offset: [0, -34] })
        .on('click', () => onSelect(academy))
        .addTo(layer)
    })

    if (points.length === 1) map.setView(points[0], 15)
    if (points.length > 1) map.fitBounds(points, { padding: [35, 35], maxZoom: 15 })
    window.setTimeout(() => map.invalidateSize(), 0)
  }, [academies, onSelect, selectedId])

  if (mapError) {
    return <div className={`academy-map academy-map-error ${className}`}><strong>Não foi possível carregar o mapa dentro do sistema.</strong><a href="https://www.openstreetmap.org/#map=13/-25.0945/-50.1633" target="_blank" rel="noreferrer">Abrir no OpenStreetMap</a></div>
  }

  return <div ref={containerRef} className={`academy-map ${className}`} aria-label="Mapa das academias" />
}
