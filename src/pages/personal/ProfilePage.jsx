import { useEffect, useState } from 'react'
import BackButton from '../../components/navigation/BackButton'
import { getPersonalProfile, getRevenue, updatePersonalProfile } from '../../lib/api'

const emptyProfile = {
  name: '',
  cref: '',
  email: '',
  cep: '',
  estado: 'PR',
  cidade: 'Ponta Grossa',
  bairro: '',
  rua: '',
  numero: '',
  complemento: '',
}

function normalizeProfile(response = {}) {
  const profile = { ...emptyProfile, ...response }
  Object.keys(emptyProfile).forEach((key) => {
    if (profile[key] === null || profile[key] === undefined) profile[key] = emptyProfile[key]
  })
  return profile
}

export default function ProfilePage({ token, onLogout }) {
  const [profile, setProfile] = useState(emptyProfile)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [revenue, setRevenue] = useState(null)
  const [loadingCep, setLoadingCep] = useState(false)

  useEffect(() => {
    getPersonalProfile(token)
      .then((response) => setProfile(normalizeProfile(response)))
      .catch(() => setError('Não foi possível carregar o perfil.'))
  }, [token])
  useEffect(() => { getRevenue(token).then(setRevenue).catch(() => null) }, [token])

  useEffect(() => {
    const cep = profile.cep || ''
    if (cep.length !== 8) return undefined
    const controller = new AbortController()
    setLoadingCep(true)
    fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (data.erro) throw new Error('CEP não encontrado.')
        setProfile((current) => ({
          ...current,
          estado: data.uf || current.estado,
          cidade: data.localidade || current.cidade,
          bairro: data.bairro || current.bairro,
          rua: data.logradouro || current.rua,
          complemento: data.complemento || current.complemento,
        }))
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCep(false)
      })
    return () => controller.abort()
  }, [profile.cep])

  function update(field, value) {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      setProfile(normalizeProfile(await updatePersonalProfile(token, profile)))
      setMessage('Perfil e município do mapa atualizados com sucesso.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const money = (value) => (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <main className="dashboard-page registration-page">
      <header className="dashboard-header">
        <div className="header-side"><BackButton fallback="/personal" /><strong>fit<span>academia</span></strong></div>
        <button onClick={onLogout}>Sair</button>
      </header>
      <section className="registration-content">
        <p className="eyebrow">MEU PERFIL</p>
        <h1>Dados profissionais</h1>
        {revenue && (
          <div className="revenue-cards">
            <div><span>Recebido no mês</span><strong>{money(revenue.received_cents)}</strong></div>
            <div><span>A receber</span><strong>{money(revenue.pending_cents)}</strong></div>
            <div><span>Em atraso</span><strong>{money(revenue.overdue_cents)}</strong></div>
          </div>
        )}
        <form className="student-form profile-form" onSubmit={submit}>
          <label>Nome completo<input required value={profile.name} onChange={(event) => update('name', event.target.value)} /></label>
          <label>CREF<input required placeholder="Ex.: CREF 000000-G/SP" value={profile.cref || ''} onChange={(event) => update('cref', event.target.value)} /></label>
          <label>E-mail<input disabled value={profile.email || ''} /></label>

          <h2>Endereço profissional</h2>
          <p className="form-section-copy">A cidade deste endereço define automaticamente o limite municipal usado no mapa de academias.</p>
          <div className="form-grid">
            <label>CEP<input inputMode="numeric" maxLength="8" value={profile.cep || ''} onChange={(event) => update('cep', event.target.value.replace(/\D/g, '').slice(0, 8))} /><small>{loadingCep ? 'Buscando endereço…' : 'Preenchimento automático pelo ViaCEP.'}</small></label>
            <label>Estado<input required maxLength="2" value={profile.estado || ''} onChange={(event) => update('estado', event.target.value.toUpperCase())} /></label>
            <label>Cidade<input required value={profile.cidade || ''} onChange={(event) => update('cidade', event.target.value)} /></label>
            <label>Bairro<input value={profile.bairro || ''} onChange={(event) => update('bairro', event.target.value)} /></label>
            <label>Rua<input value={profile.rua || ''} onChange={(event) => update('rua', event.target.value)} /></label>
            <label>Número<input value={profile.numero || ''} onChange={(event) => update('numero', event.target.value)} /></label>
            <label>Complemento<input value={profile.complemento || ''} onChange={(event) => update('complemento', event.target.value)} /></label>
          </div>

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}
          <button type="submit">Salvar perfil</button>
        </form>
      </section>
    </main>
  )
}
