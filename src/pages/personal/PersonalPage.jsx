import StudentRegistrationPage from './StudentRegistrationPage'
import StudentListPage from './StudentListPage'
import AgendaPage from './AgendaPage'

export default function PersonalPage(props) {
  const path = window.location.pathname
  if (path === '/personal/alunos/cadastrar') return <StudentRegistrationPage {...props} />
  if (path === '/personal/alunos') return <StudentListPage {...props} />
  return <AgendaPage {...props} />
}
