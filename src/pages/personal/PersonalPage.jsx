import StudentRegistrationPage from './StudentRegistrationPage'
import StudentListPage from './StudentListPage'
import AgendaPage from './AgendaPage'
import ProfilePage from './ProfilePage'
import StudentHistoryPage from './StudentHistoryPage'
import AcademiesPage from './AcademiesPage'
import FinancePage from './FinancePage'
import TelegramIntegrationPage from './TelegramIntegrationPage'

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
  return page
}
