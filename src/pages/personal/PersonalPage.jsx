import StudentRegistrationPage from './StudentRegistrationPage'
import StudentListPage from './StudentListPage'
import AgendaPage from './AgendaPage'
import ProfilePage from './ProfilePage'
import StudentHistoryPage from './StudentHistoryPage'
import StudentQuickSearch from '../../components/students/StudentQuickSearch'
import AcademiesPage from './AcademiesPage'

export default function PersonalPage(props) {
  const path = props.path || window.location.pathname
  const history = path.match(/^\/personal\/alunos\/(\d+)\/historico$/)
  const page = path === '/personal/alunos/cadastrar' ? <StudentRegistrationPage {...props} />
      : path === '/personal/alunos' ? <StudentListPage {...props} />
      : path === '/personal/academias' ? <AcademiesPage {...props} />
      : path === '/personal/perfil' ? <ProfilePage {...props} />
        : history ? <StudentHistoryPage {...props} studentId={history[1]} />
          : <AgendaPage {...props} />
  return <>{path !== '/personal' && <div className="personal-global-search"><StudentQuickSearch token={props.token} /></div>}{page}</>
}
