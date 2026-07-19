import StudentRegistrationPage from './StudentRegistrationPage'
import StudentListPage from './StudentListPage'
import AgendaPage from './AgendaPage'
import ProfilePage from './ProfilePage'
import StudentHistoryPage from './StudentHistoryPage'

export default function PersonalPage(props) {
  const path = window.location.pathname
  if (path === '/personal/alunos/cadastrar') return <StudentRegistrationPage {...props} />
  if (path === '/personal/alunos') return <StudentListPage {...props} />
  if (path === '/personal/perfil') return <ProfilePage {...props} />
  const history = path.match(/^\/personal\/alunos\/(\d+)\/historico$/)
  if (history) return <StudentHistoryPage {...props} studentId={history[1]} />
  return <AgendaPage {...props} />
}
