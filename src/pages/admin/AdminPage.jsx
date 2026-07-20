import RoleDashboard from '../shared/RoleDashboard'
import AdminUsersPage from './AdminUsersPage'

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'instant' })
}

export default function AdminPage(props) {
  if ((props.path || window.location.pathname) === '/admin/usuarios') return <AdminUsersPage {...props} />

  return <RoleDashboard {...props} title="Administrador" description="Gerencie a operação, usuários e configurações da academia.">
    <button className="admin-module-card" type="button" onClick={() => navigate('/admin/usuarios')}>
      <span className="admin-module-icon" aria-hidden="true">＋</span>
      <span><strong>Cadastrar profissional</strong><small>Crie acessos para personal trainers e professores.</small></span>
      <b aria-hidden="true">›</b>
    </button>
  </RoleDashboard>
}
