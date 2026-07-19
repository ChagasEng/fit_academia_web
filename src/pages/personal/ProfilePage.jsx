import { useEffect, useState } from 'react'
import { getPersonalProfile, updatePersonalProfile } from '../../lib/api'
import BackButton from '../../components/navigation/BackButton'

export default function ProfilePage({ token, onLogout }) {
  const [profile, setProfile] = useState({ name: '', cref: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { getPersonalProfile(token).then(setProfile).catch(() => setError('Não foi possível carregar o perfil.')) }, [token])

  async function submit(event) {
    event.preventDefault(); setMessage(''); setError('')
    try { setProfile(await updatePersonalProfile(token, profile)); setMessage('Perfil atualizado com sucesso.') } catch (requestError) { setError(requestError.message) }
  }

  return <main className="dashboard-page registration-page"><header className="dashboard-header"><div className="header-side"><BackButton fallback="/personal" /><strong>fit<span>academia</span></strong></div><button onClick={onLogout}>Sair</button></header><section className="registration-content"><p className="eyebrow">MEU PERFIL</p><h1>Dados profissionais</h1><p>Estas informações serão usadas para identificar seu atendimento.</p><form className="student-form profile-form" onSubmit={submit}><label>Nome completo<input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label><label>CREF<input required placeholder="Ex.: CREF 000000-G/SP" value={profile.cref || ''} onChange={(event) => setProfile({ ...profile, cref: event.target.value })} /></label><label>E-mail<input disabled value={profile.email || ''} /></label>{message && <p className="form-success">{message}</p>}{error && <p className="form-error">{error}</p>}<button type="submit">Salvar perfil</button></form></section></main>
}
