import RoleDashboard from '../shared/RoleDashboard'
import StudentRegistrationPage from './StudentRegistrationPage'
export default function PersonalPage(props) { return window.location.pathname === '/personal/alunos' ? <StudentRegistrationPage {...props} /> : <RoleDashboard {...props} title="Personal" description="Acompanhe seus alunos, treinos e avaliações." /> }
