import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AppErrorBoundary from './components/errors/AppErrorBoundary'
import './styles.css'

// Aplica a preferência antes da primeira renderização para evitar um clarão do
// tema oposto e garantir que os controles nativos usem o esquema correto.
try {
  const savedTheme = localStorage.getItem('fit_academia_theme')
  document.documentElement.dataset.theme = savedTheme === 'dark' ? 'dark' : 'light'
} catch {
  document.documentElement.dataset.theme = 'light'
}

createRoot(document.getElementById('root')).render(<StrictMode><AppErrorBoundary><App /></AppErrorBoundary></StrictMode>)
