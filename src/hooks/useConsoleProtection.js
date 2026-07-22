import { useEffect } from 'react'

const developmentHosts = new Set(['localhost', '127.0.0.1', '[::1]'])

function isDevelopmentHost() {
  if (typeof window === 'undefined') return true
  return developmentHosts.has(window.location.hostname)
}

function canAccessConsole(session) {
  return session?.access?.slug === 'admin'
}

function isBlockedShortcut(event) {
  const key = event.key.toLowerCase()
  return (
    event.key === 'F12' ||
    (event.ctrlKey && event.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) ||
    (event.metaKey && event.altKey && ['i', 'j', 'c'].includes(key)) ||
    (event.ctrlKey && ['u', 's'].includes(key)) ||
    (event.metaKey && ['u', 's'].includes(key))
  )
}

export default function useConsoleProtection(session) {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined
    if (isDevelopmentHost() || canAccessConsole(session)) return undefined

    const blockEvent = (event) => {
      event.preventDefault()
      event.stopImmediatePropagation?.()
      event.stopPropagation()
    }

    const blockKeys = (event) => {
      if (isBlockedShortcut(event)) blockEvent(event)
    }

    const blockContextMenu = (event) => {
      blockEvent(event)
    }

    const keyboardEvents = ['keydown', 'keypress', 'keyup']
    keyboardEvents.forEach((eventName) => {
      window.addEventListener(eventName, blockKeys, true)
      document.addEventListener(eventName, blockKeys, true)
    })
    document.addEventListener('contextmenu', blockContextMenu, true)
    window.addEventListener('contextmenu', blockContextMenu, true)

    return () => {
      keyboardEvents.forEach((eventName) => {
        window.removeEventListener(eventName, blockKeys, true)
        document.removeEventListener(eventName, blockKeys, true)
      })
      document.removeEventListener('contextmenu', blockContextMenu, true)
      window.removeEventListener('contextmenu', blockContextMenu, true)
    }
  }, [session?.access?.slug])
}
