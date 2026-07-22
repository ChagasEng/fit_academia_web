import { useEffect, useState } from 'react'
import { clearSession, readSession, rolePaths, saveSession } from './lib/auth'
import { getMenu, logout } from './lib/api'
import FooterBar from './components/navigation/FooterBar'
import ThemeToggle from './components/settings/ThemeToggle'
import LoginPage from './pages/login/LoginPage'
import { ForgotPasswordPage, ResetPasswordPage } from './pages/login/PasswordRecoveryPages'
import AdminPage from './pages/admin/AdminPage'
import PersonalPage from './pages/personal/PersonalPage'
import ProfessorPage from './pages/professor/ProfessorPage'
import AlunoPage from './pages/aluno/AlunoPage'
import ClientPage from './pages/cliente/ClientPage'
import SubscriptionBlockedPage from './pages/personal/SubscriptionBlockedPage'

const pages = { admin: AdminPage, personal: PersonalPage, professor: ProfessorPage, aluno: AlunoPage }
const currentPath = () => window.location.pathname.replace(/\/$/, '') || '/'

export default function App() {
  const [session, setSession] = useState(readSession)
  const [menu, setMenu] = useState([])
  const [path, setPath] = useState(currentPath)
  const [subscriptionBlocked, setSubscriptionBlocked] = useState(null)
  const requestedRole = path.split('/').filter(Boolean)[0]
  const sessionRole = session?.access?.slug
  const allowedRole = requestedRole === 'aluno' ? ['aluno_recorrente', 'aluno_avulso'].includes(sessionRole) : sessionRole === requestedRole
  const invalidPrivateRoute = session?.token && path !== '/cliente' && (!requestedRole || !pages[requestedRole] || !allowedRole)

  useEffect(() => {
    const syncPath = () => setPath(currentPath())
    const expireSession = () => { clearSession(); setSession(null); window.history.replaceState({}, '', '/'); setPath('/') }
    const blockSubscription = (event) => setSubscriptionBlocked(event.detail || {})
    window.addEventListener('popstate', syncPath)
    window.addEventListener('auth:expired', expireSession)
    window.addEventListener('subscription:blocked', blockSubscription)
    return () => { window.removeEventListener('popstate', syncPath); window.removeEventListener('auth:expired', expireSession); window.removeEventListener('subscription:blocked', blockSubscription) }
  }, [])

  useEffect(() => {
    if (invalidPrivateRoute) {
      const destination = rolePaths[sessionRole]
      if (destination) navigate(destination, true)
    }
  }, [invalidPrivateRoute, sessionRole])

  useEffect(() => {
    if (!session?.token) return setMenu([])
    getMenu(session.token)
      .then((response) => setMenu(response.items.filter((item) => item.path !== '/personal/integracoes/telegram')))
      .catch(() => setMenu([]))
  }, [session])

  function navigate(nextPath, replace = false) {
    if (currentPath() === nextPath) return
    window.history[replace ? 'replaceState' : 'pushState']({}, '', nextPath)
    setPath(currentPath())
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function handleLogin(nextSession) { saveSession(nextSession); setSession(nextSession); setSubscriptionBlocked(null); navigate(rolePaths[nextSession.access.slug] || '/', true) }
  async function handleLogout() {
    try { await logout(session.token) } catch { /* a sessão local deve encerrar mesmo sem conexão */ }
    finally { clearSession(); setSession(null); setSubscriptionBlocked(null); navigate('/', true) }
  }

  if (invalidPrivateRoute) return null
  if (path === '/cliente') return <><ThemeToggle /><ClientPage /></>
  if (path === '/esqueci-minha-senha') return <><ThemeToggle /><ForgotPasswordPage onBack={() => navigate('/', true)} /></>
  if (path === '/redefinir-senha') return <><ThemeToggle /><ResetPasswordPage onBack={() => navigate('/', true)} onRequestNewLink={() => navigate('/esqueci-minha-senha', true)} /></>
  if (!session || !requestedRole || !pages[requestedRole] || !allowedRole) return <><ThemeToggle /><LoginPage onLogin={handleLogin} onForgotPassword={() => navigate('/esqueci-minha-senha')} /></>
  if (sessionRole === 'personal' && subscriptionBlocked) return <><ThemeToggle /><SubscriptionBlockedPage token={session.token} subscription={subscriptionBlocked} onReactivated={() => setSubscriptionBlocked(null)} onLogout={handleLogout} /></>

  const Page = pages[requestedRole]
  return <><ThemeToggle /><Page path={path} user={session.user} token={session.token} onLogout={handleLogout} onNavigate={navigate} />{menu.length > 0 && <FooterBar items={menu} onNavigate={navigate} />}</>
}
