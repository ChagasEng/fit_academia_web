import { useEffect, useState } from 'react'
import { clearSession, readSession, rolePaths, saveSession } from './lib/auth'
import { getMenu, logout } from './lib/api'
import FooterBar from './components/navigation/FooterBar'
import ThemeToggle from './components/settings/ThemeToggle'
import LoginPage from './pages/login/LoginPage'
import AdminPage from './pages/admin/AdminPage'
import PersonalPage from './pages/personal/PersonalPage'
import ProfessorPage from './pages/professor/ProfessorPage'
import AlunoPage from './pages/aluno/AlunoPage'
import ClientPage from './pages/cliente/ClientPage'

const pages = { admin: AdminPage, personal: PersonalPage, professor: ProfessorPage, aluno: AlunoPage }
const currentPath = () => window.location.pathname.replace(/\/$/, '') || '/'

export default function App() {
  const [session, setSession] = useState(readSession)
  const [menu, setMenu] = useState([])
  const [path, setPath] = useState(currentPath)
  const requestedRole = path.split('/').filter(Boolean)[0]

  useEffect(() => {
    const syncPath = () => setPath(currentPath())
    const expireSession = () => { clearSession(); setSession(null); window.history.replaceState({}, '', '/'); setPath('/') }
    window.addEventListener('popstate', syncPath)
    window.addEventListener('auth:expired', expireSession)
    return () => { window.removeEventListener('popstate', syncPath); window.removeEventListener('auth:expired', expireSession) }
  }, [])

  useEffect(() => {
    if (session?.token && !requestedRole) {
      const destination = rolePaths[session.access?.slug]
      if (destination) navigate(destination, true)
    }
  }, [session, requestedRole])

  useEffect(() => {
    if (!session?.token) return setMenu([])
    getMenu(session.token).then((response) => setMenu(response.items)).catch(() => setMenu([]))
  }, [session])

  function navigate(nextPath, replace = false) {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', nextPath)
    setPath(currentPath())
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function handleLogin(nextSession) { saveSession(nextSession); setSession(nextSession); navigate(rolePaths[nextSession.access.slug] || '/') }
  async function handleLogout() { await logout(session.token); clearSession(); setSession(null); navigate('/') }

  if (session?.token && !requestedRole) return null
  if (path === '/cliente') return <><ThemeToggle /><ClientPage /></>
  const allowedRole = requestedRole === 'aluno' ? ['aluno_recorrente', 'aluno_avulso'].includes(session?.access?.slug) : session?.access?.slug === requestedRole
  if (!session || !requestedRole || !pages[requestedRole] || !allowedRole) return <><ThemeToggle /><LoginPage onLogin={handleLogin} /></>

  const Page = pages[requestedRole]
  return <><ThemeToggle /><Page user={session.user} token={session.token} onLogout={handleLogout} />{menu.length > 0 && <FooterBar items={menu} />}</>
}
