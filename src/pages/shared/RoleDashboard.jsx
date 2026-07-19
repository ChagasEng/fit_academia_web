import BackButton from '../../components/navigation/BackButton'

export default function RoleDashboard({ title, description, user, onLogout }) {
  return <main className="dashboard-page">
    <header className="dashboard-header"><div className="header-side"><BackButton /><strong>fit<span>academia</span></strong></div><button onClick={onLogout}>Sair</button></header>
    <section className="dashboard-content">
      <p className="eyebrow">{title.toUpperCase()}</p>
      <h1>Olá, {user?.name || 'usuário'}.</h1>
      <p>{description}</p>
      <div className="coming-soon">Módulos desta área em construção.</div>
    </section>
  </main>
}
