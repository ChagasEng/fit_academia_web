import { useCallback, useEffect, useState } from 'react'
import BackButton from '../../components/navigation/BackButton'
import { createAdminUser, getAdminUsers, markPersonalSubscriptionPaid } from '../../lib/api'

const roles = [
  { id: 2, label: 'Personal', description: 'Atende e acompanha alunos individualmente.' },
  { id: 3, label: 'Professor', description: 'Conduz aulas, turmas e atividades da academia.' },
]
const emptyForm = { name: '', email: '', cref: '', password: '', password_confirmation: '', usuario_tipo_id: '' }

export default function AdminUsersPage({ token, user, onLogout }) {
  const [form, setForm] = useState(emptyForm)
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [saving, setSaving] = useState(false)
  const [payingId, setPayingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadUsers = useCallback(async (signal) => {
    setLoadingUsers(true)
    try {
      const response = await getAdminUsers(token, '', '', signal)
      setUsers(response.users?.data || [])
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message)
    } finally {
      if (!signal?.aborted) setLoadingUsers(false)
    }
  }, [token])

  useEffect(() => {
    const controller = new AbortController()
    loadUsers(controller.signal)
    return () => controller.abort()
  }, [loadUsers])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    if (form.password !== form.password_confirmation) {
      setError('A confirmação de senha precisa ser igual à senha inicial.')
      return
    }

    setSaving(true)
    try {
      const created = await createAdminUser(token, { ...form, usuario_tipo_id: Number(form.usuario_tipo_id) })
      setMessage(`${created.name} foi cadastrado como ${created.types?.[0]?.nome || 'profissional'}.`)
      setForm(emptyForm)
      await loadUsers()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkPaid(professional) {
    if (!window.confirm(`Confirmar o pagamento mensal de ${professional.name}?`)) return
    setMessage('')
    setError('')
    setPayingId(professional.id)
    try {
      const response = await markPersonalSubscriptionPaid(token, professional.id)
      setUsers((current) => current.map((item) => item.id === professional.id ? { ...item, subscription: response.subscription } : item))
      setMessage(`Pagamento de ${professional.name} confirmado. Acesso válido até ${formatDate(response.subscription.pago_ate)}.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setPayingId(null)
    }
  }

  return <main className="dashboard-page admin-users-page">
    <header className="dashboard-header">
      <div className="header-side"><BackButton fallback="/admin" /><strong>fit<span>academia</span></strong></div>
      <button onClick={onLogout}>Sair</button>
    </header>
    <section className="admin-users-content">
      <div className="admin-users-heading">
        <div><p className="eyebrow">ADMIN · {(user?.name || 'USUÁRIO').toUpperCase()}</p><h1>Cadastro de usuários</h1><p>Crie o acesso inicial de personals e professores.</p></div>
        <div className="admin-users-count"><strong>{users.length}</strong><span>profissionais exibidos</span></div>
      </div>

      <div className="admin-users-layout">
        <form className="admin-user-form" onSubmit={handleSubmit}>
          <div><span className="admin-section-number">1</span><h2>Tipo de acesso</h2></div>
          <div className="admin-role-options">
            {roles.map((role) => <button key={role.id} className={Number(form.usuario_tipo_id) === role.id ? 'selected' : ''} type="button" aria-pressed={Number(form.usuario_tipo_id) === role.id} onClick={() => update('usuario_tipo_id', role.id)}>
              <span className="admin-role-check" aria-hidden="true">{Number(form.usuario_tipo_id) === role.id ? '✓' : ''}</span>
              <span><strong>{role.label}</strong><small>{role.description}</small></span>
            </button>)}
          </div>

          <div><span className="admin-section-number">2</span><h2>Dados do profissional</h2></div>
          <div className="form-grid">
            <Field label="Nome completo" value={form.name} onChange={(value) => update('name', value)} autoComplete="name" required />
            <Field label="CREF" value={form.cref} onChange={(value) => update('cref', value.toUpperCase())} placeholder="Ex.: CREF 123456-G/PR" required />
            <Field label="E-mail de acesso" type="email" value={form.email} onChange={(value) => update('email', value)} autoComplete="email" required />
          </div>

          <div><span className="admin-section-number">3</span><h2>Senha inicial</h2></div>
          <p className="admin-form-help">Use ao menos 8 caracteres. Entregue esta senha ao profissional por um canal seguro.</p>
          <div className="form-grid">
            <Field label="Senha" type="password" value={form.password} onChange={(value) => update('password', value)} autoComplete="new-password" minLength={8} required />
            <Field label="Confirmar senha" type="password" value={form.password_confirmation} onChange={(value) => update('password_confirmation', value)} autoComplete="new-password" minLength={8} required />
          </div>

          {!form.usuario_tipo_id && <p className="admin-role-reminder">Selecione Personal ou Professor para liberar o cadastro.</p>}
          {message && <p className="form-success" role="status">{message}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="admin-submit" type="submit" disabled={saving || !form.usuario_tipo_id}>{saving ? 'Cadastrando...' : 'Cadastrar profissional'}</button>
        </form>

        <aside className="admin-user-directory">
          <div className="admin-directory-heading"><div><span>ACESSOS CRIADOS</span><h2>Profissionais</h2></div></div>
          {loadingUsers && <p className="admin-list-status">Carregando usuários...</p>}
          {!loadingUsers && users.length === 0 && <p className="admin-list-status">Nenhum personal ou professor cadastrado.</p>}
          {!loadingUsers && users.map((professional) => {
            const role = professional.types?.[0]
            const subscription = professional.subscription
            return <article key={professional.id}>
              <span className="student-avatar" aria-hidden="true">{professional.name?.charAt(0).toUpperCase()}</span>
              <span><strong>{professional.name}</strong><small>{professional.email}</small><em className={`admin-role-badge ${role?.slug || ''}`}>{role?.nome || 'Profissional'}</em></span>
              {subscription ? <div className="admin-subscription-control">
                <span className={`admin-subscription-status ${subscription.status}`}>{subscriptionLabel(subscription.status)}</span>
                <small>{subscriptionDescription(subscription)}</small>
                <button type="button" onClick={() => handleMarkPaid(professional)} disabled={payingId === professional.id}>{payingId === professional.id ? 'Salvando...' : 'PAGO'}</button>
              </div> : <span className="admin-user-status active">Sem mensalidade</span>}
            </article>
          })}
        </aside>
      </div>
    </section>
  </main>
}

function Field({ label, type = 'text', value, onChange, ...inputProps }) {
  return <label>{label}<input {...inputProps} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR')
}

function subscriptionLabel(status) {
  return { pago: 'Pago', devendo: 'Devendo', bloqueado: 'Bloqueado' }[status] || status
}

function subscriptionDescription(subscription) {
  if (subscription.status === 'pago') return `Válido até ${formatDate(subscription.pago_ate)}`
  if (subscription.status === 'devendo') return `Acesso em carência até ${formatDate(subscription.carencia_ate)}`
  return `Carência encerrada em ${formatDate(subscription.carencia_ate)}`
}
