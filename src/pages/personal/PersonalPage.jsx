import StudentRegistrationPage from './StudentRegistrationPage'
import StudentListPage from './StudentListPage'
import AgendaPage from './AgendaPage'
import ProfilePage from './ProfilePage'

export default function PersonalPage(props) {
  const path = window.location.pathname
  if (path === '/personal/alunos/cadastrar') return <StudentRegistrationPage {...props} />
  if (path === '/personal/alunos') return <StudentListPage {...props} />
  if (path === '/personal/perfil') return <ProfilePage {...props} />
  return <AgendaPage {...props} />
}
