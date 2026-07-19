import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const apiUrl = window.__APP_CONFIG__?.apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

function App() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">FIT ACADEMIA</p>
        <h1>Seu treino. Sua evolução.</h1>
        <p>Plataforma digital para alunos, planos e gestão da academia.</p>
        <a href={`${apiUrl}/`} target="_blank" rel="noreferrer">Ver status da API</a>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
