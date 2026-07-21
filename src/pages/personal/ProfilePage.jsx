import { useEffect, useState } from 'react'
import BackButton from '../../components/navigation/BackButton'
import StudentQuickSearch from '../../components/students/StudentQuickSearch'
import { getPersonalProfile, getRevenue, updatePersonalProfile } from '../../lib/api'
import { formatCep, formatCref, onlyDigits } from '../../lib/masks'

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
  horario_inicio: '05:00',
  horario_fim: '20:00',
  telegram_daily_summary_enabled: false,
  telegram_daily_summary_available: false,
  telegram_daily_summary_last_sent_on: null,
}

function normalizeProfile(response = {}) {
  const profile = { ...emptyProfile, ...response }
  Object.keys(emptyProfile).forEach((key) => {
    if (profile[key] === null || profile[key] === undefined) profile[key] = emptyProfile[key]
  })
  profile.horario_inicio = String(profile.horario_inicio).slice(0, 5)
  profile.horario_fim = String(profile.horario_fim).slice(0, 5)
  profile.telegram_daily_summary_enabled = Boolean(profile.telegram_daily_summary_enabled)
  profile.telegram_daily_summary_available = Boolean(profile.telegram_daily_summary_available)
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
      setMessage('Perfil e horário da agenda atualizados com sucesso.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const money = (value) => (Number(value || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <main className="dashboard-page registration-page">
      <header className="dashboard-header">
        <div className="header-side"><BackButton fallback="/personal" /><strong>fit<span>academia</span></strong></div>
        <div className="header-actions"><StudentQuickSearch token={token} /><button onClick={onLogout}>Sair</button></div>
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
          <label>CREF<input required inputMode="text" maxLength={15} placeholder="CREF 000000-G/PR" value={formatCref(profile.cref || '')} onChange={(event) => update('cref', formatCref(event.target.value))} /></label>
          <label>E-mail<input disabled value={profile.email || ''} /></label>

          <h2>Horário de funcionamento</h2>
          <p className="form-section-copy">A grade da agenda e os horários disponíveis para novos agendamentos seguirão este expediente.</p>
          <div className="working-hours-fields">
            <label>Começo do expediente <small>(receber mensagem no Telegram)</small><input type="time" step="1800" required value={profile.horario_inicio} onChange={(event) => update('horario_inicio', event.target.value)} /></label>
            <span aria-hidden="true">até</span>
            <label>Fim do expediente<input type="time" step="1800" required value={profile.horario_fim} onChange={(event) => update('horario_fim', event.target.value)} /></label>
          </div>
          <label className={`telegram-summary-option ${profile.telegram_daily_summary_enabled ? 'enabled' : ''} ${!profile.telegram_daily_summary_available ? 'unavailable' : ''}`}>
            <input
              type="checkbox"
              checked={profile.telegram_daily_summary_enabled}
              disabled={!profile.telegram_daily_summary_available}
              onChange={(event) => update('telegram_daily_summary_enabled', event.target.checked)}
            />
            <span className="telegram-summary-switch" aria-hidden="true" />
            <span>
              <strong>Receber resumo diário no Telegram</strong>
              <small>
                {profile.telegram_daily_summary_available
                  ? `Às ${profile.horario_inicio || '--:--'}, o bot enviará seus atendimentos e horários livres do dia.`
                  : 'Conecte o Telegram e envie /start ao bot para liberar esta opção.'}
              </small>
            </span>
          </label>
          <div className="working-hours-preview"><span aria-hidden="true">◷</span><div><small>SUA AGENDA FUNCIONARÁ</small><strong>Das {profile.horario_inicio || '--:--'} às {profile.horario_fim || '--:--'}</strong></div></div>

          <h2>Endereço profissional</h2>
          <p className="form-section-copy">A cidade deste endereço define automaticamente o limite municipal usado no mapa de academias.</p>
          <div className="form-grid">
            <label>CEP<input inputMode="numeric" autoComplete="postal-code" maxLength="9" placeholder="00000-000" value={formatCep(profile.cep || '')} onChange={(event) => update('cep', onlyDigits(event.target.value).slice(0, 8))} /><small>{loadingCep ? 'Buscando endereço…' : 'Preenchimento automático pelo ViaCEP.'}</small></label>
            <label>Estado<input required maxLength="2" value={profile.estado || ''} onChange={(event) => update('estado', event.target.value.replace(/[^a-z]/gi, '').toUpperCase())} /></label>
            <label>Cidade<input required value={profile.cidade || ''} onChange={(event) => update('cidade', event.target.value)} /></label>
            <label>Bairro<input value={profile.bairro || ''} onChange={(event) => update('bairro', event.target.value)} /></label>
            <label>Rua<input value={profile.rua || ''} onChange={(event) => update('rua', event.target.value)} /></label>
            <label>Número<input inputMode="text" maxLength="20" value={profile.numero || ''} onChange={(event) => update('numero', event.target.value)} /></label>
            <label>Complemento<input maxLength="255" value={profile.complemento || ''} onChange={(event) => update('complemento', event.target.value)} /></label>
          </div>

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}
          <button type="submit">Salvar perfil</button>
        </form>
      </section>
    </main>
  )
}
