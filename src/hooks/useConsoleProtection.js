import { useEffect } from 'react'

const developmentHosts = new Set(['localhost', '127.0.0.1', '[::1]'])

function isDevelopmentHost() {
  if (typeof window === 'undefined') return true
  return developmentHosts.has(window.location.hostname)
}

function canAccessConsole(session) {
  return session?.access?.slug === 'admin'
}

export default function useConsoleProtection(session) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    if (isDevelopmentHost() || canAccessConsole(session)) return undefined

    const blockKeys = (event) => {
      const key = event.key.toLowerCase()
      const shouldBlock =
        event.key === 'F12' ||
        (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (event.ctrlKey && key === 'u')

      if (!shouldBlock) return
      event.preventDefault()
      event.stopPropagation()
    }

    const blockContextMenu = (event) => {
      event.preventDefault()
    }

    document.addEventListener('keydown', blockKeys, true)
    document.addEventListener('contextmenu', blockContextMenu, true)

    return () => {
      document.removeEventListener('keydown', blockKeys, true)
      document.removeEventListener('contextmenu', blockContextMenu, true)
    }
  }, [session?.access?.slug])
}
