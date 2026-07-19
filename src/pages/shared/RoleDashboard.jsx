import { useEffect, useState } from 'react'
import { getMenu } from '../../lib/api'
import FooterBar from '../../components/navigation/FooterBar'

export default function RoleDashboard({ title, description, user, token, onLogout }) {
  const [menu, setMenu] = useState([])

  useEffect(() => {
    getMenu(token).then((response) => setMenu(response.items)).catch(() => setMenu([]))
  }, [token])

  return <main className="dashboard-page">
    <header className="dashboard-header"><strong>fit<span>academia</span></strong><button onClick={onLogout}>Sair</button></header>
    <section className="dashboard-content">
      <p className="eyebrow">{title.toUpperCase()}</p>
      <h1>Olá, {user.name}.</h1>
      <p>{description}</p>
      <div className="coming-soon">Módulos desta área em construção.</div>
    </section>
    {menu.length > 0 && <FooterBar items={menu} />}
  </main>
}
