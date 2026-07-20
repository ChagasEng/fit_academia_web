import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../../lib/googleMaps'

const defaultCenter = { lat: -25.0945, lng: -50.1633 }

export default function AcademyMap({ academies, selectedId, onSelect, className = '' }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const [mapError, setMapError] = useState('')
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    let active = true
    loadGoogleMaps()
      .then((maps) => {
        if (!active || !containerRef.current) return
        mapRef.current = new maps.Map(containerRef.current, {
          center: defaultCenter,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        })
        setMapReady(true)
      })
      .catch((error) => { if (active) setMapError(error.message) })

    return () => {
      active = false
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current = []
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const maps = window.google?.maps
    if (!map || !maps) return

    markersRef.current.forEach((marker) => marker.setMap(null))
    const bounds = new maps.LatLngBounds()
    let hasPoints = false

    markersRef.current = academies.flatMap((academy) => {
      const latitude = Number(academy.latitude)
      const longitude = Number(academy.longitude)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !latitude || !longitude) return []

      const selected = Number(selectedId) === Number(academy.id)
      const studentsCount = Number.isFinite(Number(academy.students_count)) ? String(academy.students_count) : '0'
      const marker = new maps.Marker({
        map,
        position: { lat: latitude, lng: longitude },
        title: academy.nome || 'Academia',
        label: { text: studentsCount, color: '#ffffff', fontWeight: '700' },
        icon: {
          path: maps.SymbolPath.CIRCLE,
          fillColor: selected ? '#0d624d' : '#137d62',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: selected ? 4 : 2,
          scale: selected ? 15 : 12,
        },
      })
      marker.addListener('click', () => onSelect(academy))
      bounds.extend(marker.getPosition())
      hasPoints = true
      return [marker]
    })

    if (hasPoints) {
      if (markersRef.current.length === 1) map.setCenter(bounds.getCenter())
      else map.fitBounds(bounds, 35)
    }
  }, [academies, mapReady, onSelect, selectedId])

  if (mapError) {
    return <div className={`academy-map academy-map-error ${className}`}><strong>{mapError}</strong><a href="https://www.google.com/maps/search/?api=1&query=-25.0945,-50.1633" target="_blank" rel="noreferrer">Abrir no Google Maps</a></div>
  }

  return <div ref={containerRef} className={`academy-map ${className}`} aria-label="Mapa das academias no Google Maps" />
}
