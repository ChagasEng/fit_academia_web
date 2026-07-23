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
  const code = event.code
  const isFunctionKey = /^F\d{1,2}$/.test(event.key) || /^F\d{1,2}$/.test(code)
  const ctrlOrMeta = event.ctrlKey || event.metaKey

  return (
    event.key === 'F12' ||
    code === 'F12' ||
    key === 'contextmenu' ||
    code === 'ContextMenu' ||
    (event.shiftKey && (event.key === 'F10' || code === 'F10')) ||
    (event.shiftKey && ['F5', 'F7', 'F9'].includes(event.key)) ||
    (event.shiftKey && ['F5', 'F7', 'F9'].includes(code)) ||
    (ctrlOrMeta && event.shiftKey && ['i', 'j', 'c', 'k', 'e', 'z', 'm', 'p'].includes(key)) ||
    (event.ctrlKey && event.altKey && event.shiftKey && key === 'i') ||
    (event.metaKey && event.altKey && event.shiftKey && key === 'i') ||
    (event.metaKey && event.altKey && ['i', 'j', 'c', 'k', 'e', 'm'].includes(key)) ||
    (ctrlOrMeta && ['u', 's'].includes(key)) ||
    (event.altKey && isFunctionKey)
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
