import { useEffect, useState } from 'react'

const storageKey = 'fit_academia_theme'

export default function ThemeToggle({ show = true }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(storageKey) === 'dark' ? 'dark' : 'light' }
    catch { return 'light' }
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem(storageKey, theme) } catch { /* tema continua válido nesta aba */ }
  }, [theme])

  if (!show || window.location.pathname !== '/personal/perfil') return null
  return <button className="theme-toggle" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Alternar tema">
    <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>{theme === 'dark' ? 'Claro' : 'Escuro'}
  </button>
}
