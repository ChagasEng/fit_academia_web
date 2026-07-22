import { lazy, Suspense } from 'react'

const StudentRegistrationPage = lazy(() => import('./StudentRegistrationPage'))
const StudentListPage = lazy(() => import('./StudentListPage'))
const AgendaPage = lazy(() => import('./AgendaPage'))
const ProfilePage = lazy(() => import('./ProfilePage'))
const StudentHistoryPage = lazy(() => import('./StudentHistoryPage'))
const AcademiesPage = lazy(() => import('./AcademiesPage'))
const FinancePage = lazy(() => import('./FinancePage'))
const TelegramIntegrationPage = lazy(() => import('./TelegramIntegrationPage'))

export default function PersonalPage(props) {
  const path = props.path || window.location.pathname
  const history = path.match(/^\/personal\/alunos\/(\d+)\/historico$/)
  const page = path === '/personal/alunos/cadastrar' ? <StudentRegistrationPage {...props} />
      : path === '/personal/alunos' ? <StudentListPage {...props} />
      : path === '/personal/academias' ? <AcademiesPage {...props} />
      : path === '/personal/faturamento' ? <FinancePage {...props} />
      : path === '/personal/integracoes/telegram' ? <TelegramIntegrationPage {...props} />
      : path === '/personal/perfil' ? <ProfilePage {...props} />
        : history ? <StudentHistoryPage {...props} studentId={history[1]} />
          : <AgendaPage {...props} />
  return <Suspense fallback={<main className="dashboard-page"><div className="route-loading route-loading-inline" role="status"><span /><strong>Carregando tela…</strong></div></main>}>{page}</Suspense>
}
