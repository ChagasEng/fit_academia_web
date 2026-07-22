import { lazy, Suspense, useEffect, useState } from 'react'
import { clearSession, readSession, rolePaths, saveSession } from './lib/auth'
import { getMenu, logout } from './lib/api'
import FooterBar from './components/navigation/FooterBar'
import ThemeToggle from './components/settings/ThemeToggle'
import useConsoleProtection from './hooks/useConsoleProtection'
import LoginPage from './pages/login/LoginPage'
import { ForgotPasswordPage, ResetPasswordPage } from './pages/login/PasswordRecoveryPages'

const AdminPage = lazy(() => import('./pages/admin/AdminPage'))
const PersonalPage = lazy(() => import('./pages/personal/PersonalPage'))
const ProfessorPage = lazy(() => import('./pages/professor/ProfessorPage'))
const AlunoPage = lazy(() => import('./pages/aluno/AlunoPage'))
const ClientPage = lazy(() => import('./pages/cliente/ClientPage'))
const SubscriptionBlockedPage = lazy(() => import('./pages/personal/SubscriptionBlockedPage'))

const pages = { admin: AdminPage, personal: PersonalPage, professor: ProfessorPage, aluno: AlunoPage }
const currentPath = () => window.location.pathname.replace(/\/$/, '') || '/'
const roleLabels = { admin: 'administração', personal: 'área do personal', professor: 'área do professor', aluno: 'área do aluno' }
const loadingScreen = (label) => <main className="route-loading" role="status"><span /><strong>Carregando {label}…</strong></main>

export default function App() {
  const [session, setSession] = useState(readSession)
  const [menu, setMenu] = useState([])
  const [path, setPath] = useState(currentPath)
  const [subscriptionBlocked, setSubscriptionBlocked] = useState(null)
  const requestedRole = path.split('/').filter(Boolean)[0]
  const sessionRole = session?.access?.slug
  const allowedRole = requestedRole === 'aluno' ? ['aluno_recorrente', 'aluno_avulso'].includes(sessionRole) : sessionRole === requestedRole
  const invalidPrivateRoute = session?.token && path !== '/cliente' && (!requestedRole || !pages[requestedRole] || !allowedRole)
  useConsoleProtection(session)

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

  function navigate(nextPath, replace = false, navigationState = {}) {
    if (currentPath() === nextPath) return
    window.history[replace ? 'replaceState' : 'pushState'](navigationState, '', nextPath)
    setPath(currentPath())
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function handleLogin(nextSession) { saveSession(nextSession); setSession(nextSession); setSubscriptionBlocked(null); navigate(rolePaths[nextSession.access.slug] || '/', true) }
  async function handleLogout() {
    try { await logout(session.token) } catch { /* a sessão local deve encerrar mesmo sem conexão */ }
    finally { clearSession(); setSession(null); setSubscriptionBlocked(null); navigate('/', true) }
  }

  if (invalidPrivateRoute) return null
  if (path === '/cliente') return <Suspense fallback={loadingScreen('área do cliente')}><ThemeToggle /><ClientPage /></Suspense>
  if (path === '/esqueci-minha-senha') return <><ThemeToggle /><ForgotPasswordPage onBack={() => navigate('/', true)} /></>
  if (path === '/redefinir-senha') return <><ThemeToggle /><ResetPasswordPage onBack={() => navigate('/', true)} onRequestNewLink={() => navigate('/esqueci-minha-senha', true)} /></>
  if (!session || !requestedRole || !pages[requestedRole] || !allowedRole) return <><ThemeToggle /><LoginPage onLogin={handleLogin} onForgotPassword={() => navigate('/esqueci-minha-senha')} /></>
  if (sessionRole === 'personal' && subscriptionBlocked) return <Suspense fallback={loadingScreen('assinatura')}><ThemeToggle /><SubscriptionBlockedPage token={session.token} subscription={subscriptionBlocked} onReactivated={() => setSubscriptionBlocked(null)} onLogout={handleLogout} /></Suspense>

  const Page = pages[requestedRole]
  const footerItems = sessionRole === 'personal'
    ? menu.filter((item) => item.path !== '/personal/academias')
    : menu

  return <Suspense fallback={loadingScreen(roleLabels[requestedRole] || 'seu painel')}><ThemeToggle /><Page path={path} user={session.user} token={session.token} onLogout={handleLogout} onNavigate={navigate} />{footerItems.length > 0 && <FooterBar items={footerItems} onNavigate={navigate} />}</Suspense>
}
