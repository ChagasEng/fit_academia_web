import { useState } from 'react'
import { clearSession, readSession, rolePaths, saveSession } from './lib/auth'
import LoginPage from './pages/login/LoginPage'
import AdminPage from './pages/admin/AdminPage'
import PersonalPage from './pages/personal/PersonalPage'
import ProfessorPage from './pages/professor/ProfessorPage'
import AlunoPage from './pages/aluno/AlunoPage'
import ClientPage from './pages/cliente/ClientPage'

const pages = { admin: AdminPage, personal: PersonalPage, professor: ProfessorPage, aluno: AlunoPage }

export default function App() {
  const [session, setSession] = useState(readSession)
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  const requestedRole = Object.entries(rolePaths).find(([, rolePath]) => rolePath === path)?.[0]

  function navigate(nextPath) { window.history.pushState({}, '', nextPath); window.location.reload() }
  function handleLogin(nextSession) { saveSession(nextSession); navigate(rolePaths[nextSession.access.slug] || '/') }
  function handleLogout() { clearSession(); navigate('/') }

  if (path === '/cliente') return <ClientPage />
  if (!session || !requestedRole || session.access.slug !== requestedRole) return <LoginPage onLogin={handleLogin} />

  const Page = pages[requestedRole]
  return <Page user={session.user} onLogout={handleLogout} />
}
