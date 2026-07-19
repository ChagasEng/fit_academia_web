export default function RoleDashboard({ title, description, user, onLogout }) {
  return <main className="dashboard-page">
    <header className="dashboard-header"><strong>fit<span>academia</span></strong><button onClick={onLogout}>Sair</button></header>
    <section className="dashboard-content">
      <p className="eyebrow">{title.toUpperCase()}</p>
      <h1>Olá, {user.name}.</h1>
      <p>{description}</p>
      <div className="coming-soon">Módulos desta área em construção.</div>
    </section>
  </main>
}
