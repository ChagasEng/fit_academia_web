import { useEffect, useRef } from 'react'
import L from 'leaflet'

export default function AcademyMap({ academies, selectedId, onSelect, className = '' }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined

    const map = L.map(containerRef.current, { zoomControl: true }).setView([-25.0945, -50.1633], 13)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    mapRef.current = map
    layerRef.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
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

  return <div ref={containerRef} className={`academy-map ${className}`} aria-label="Mapa das academias" />
}
