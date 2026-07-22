import { useEffect, useRef, useState } from 'react'
import { forgotPassword, resetPassword, validateResetToken } from '../../lib/api'

const storageKey = 'fit_academia_password_reset'

function Brand() {
  return <div className="brand" aria-label="Fit Academia"><span className="brand-mark" aria-hidden="true">F</span><span>fit<span>academia</span></span></div>
}

function RecoveryLayout({ children, title, description, onBack }) {
  return <main className="recovery-page">
    <section className="recovery-presentation" aria-hidden="true">
      <Brand />
      <div><p className="eyebrow">SEGURANÇA DA CONTA</p><h1>Sua conta,<br />protegida.</h1><p>Recupere o acesso com segurança e volte à sua rotina.</p></div>
      <p>© {new Date().getFullYear()} Fit Academia</p>
    </section>
    <section className="recovery-panel">
      <div className="recovery-card">
        <button className="recovery-back" type="button" onClick={onBack}>← Voltar para o login</button>
        <div className="form-heading"><p className="eyebrow">RECUPERAÇÃO DE SENHA</p><h2>{title}</h2><p>{description}</p></div>
        {children}
      </div>
    </section>
  </main>
}

export function ForgotPasswordPage({ onBack }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return setError('Informe um endereço de e-mail válido.')

    setLoading(true); setError('')
    try {
      const response = await forgotPassword(normalizedEmail)
      setMessage(response.message)
    } catch (requestError) {
      setError(requestError.message)
    } finally { setLoading(false) }
  }

  return <RecoveryLayout title="Esqueceu sua senha?" description="Informe seu e-mail para receber as instruções de redefinição." onBack={onBack}>
    {message ? <div className="recovery-success" role="status"><strong>Confira seu e-mail</strong><p>{message}</p><button type="button" onClick={onBack}>Voltar ao login</button></div> : <form className="login-form" onSubmit={submit} noValidate aria-busy={loading}>
      <div className="login-field"><label htmlFor="recovery-email">E-mail</label><div className="login-input-shell"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16v11H4z"/><path d="m4.5 7 7.5 6 7.5-6"/></svg><input id="recovery-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck="false" placeholder="voce@exemplo.com" value={email} disabled={loading} aria-invalid={Boolean(error)} onChange={(event) => { setEmail(event.target.value); setError('') }} /></div></div>
      {error && <p className="login-error" role="alert"><span aria-hidden="true">!</span>{error}</p>}
      <button className="login-submit" type="submit" disabled={loading}>{loading ? 'Enviando…' : 'Enviar instruções'}</button>
    </form>}
  </RecoveryLayout>
}

function readResetData() {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  const email = params.get('email')
  if (token && email) {
    const data = { token, email: email.trim().toLowerCase() }
    try { sessionStorage.setItem(storageKey, JSON.stringify(data)) } catch { /* armazenamento pode estar indisponível */ }
    window.history.replaceState({}, '', '/redefinir-senha')
    return data
  }
  try { return JSON.parse(sessionStorage.getItem(storageKey) || 'null') } catch { return null }
}

export function ResetPasswordPage({ onBack, onRequestNewLink }) {
  const [resetData] = useState(readResetData)
  const [valid, setValid] = useState(null)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const validated = useRef(false)

  useEffect(() => {
    if (validated.current) return
    validated.current = true
    if (!resetData?.email || !resetData?.token) return setValid(false)
    validateResetToken(resetData.email, resetData.token).then((response) => setValid(response.valid === true)).catch(() => setValid(false))
  }, [resetData])

  async function submit(event) {
    event.preventDefault()
    if (password !== confirmation) return setError('As senhas não coincidem.')
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) return setError('Use ao menos 8 caracteres, com maiúscula, minúscula, número e símbolo.')

    setLoading(true); setError('')
    try {
      await resetPassword({ email: resetData.email, token: resetData.token, password, passwordConfirmation: confirmation })
      try { sessionStorage.removeItem(storageKey) } catch { /* sem impacto no resultado */ }
      setSuccess(true)
    } catch (requestError) {
      setError(requestError.message)
    } finally { setLoading(false) }
  }

  if (success) return <RecoveryLayout title="Senha redefinida" description="Sua senha foi alterada e os acessos anteriores foram encerrados." onBack={onBack}><div className="recovery-success" role="status"><strong>Tudo certo.</strong><p>Use sua nova senha para entrar novamente.</p><button className="login-submit" type="button" onClick={onBack}>Ir para o login</button></div></RecoveryLayout>
  if (valid === null) return <RecoveryLayout title="Verificando link" description="Aguarde enquanto validamos seu link de redefinição." onBack={onBack}><p className="recovery-loading" role="status">Verificando…</p></RecoveryLayout>
  if (!valid) return <RecoveryLayout title="Link indisponível" description="Este link é inválido, expirou ou já foi utilizado." onBack={onBack}><div className="recovery-invalid"><p>Solicite uma nova redefinição de senha para continuar.</p><button className="login-submit" type="button" onClick={() => { try { sessionStorage.removeItem(storageKey) } catch {} onRequestNewLink() }}>Solicitar novo link</button></div></RecoveryLayout>

  return <RecoveryLayout title="Crie uma nova senha" description="Escolha uma senha forte que você ainda não tenha usado nesta conta." onBack={onBack}>
    <form className="login-form" onSubmit={submit} noValidate aria-busy={loading}>
      <div className="login-field"><label htmlFor="new-password">Nova senha</label><div className="login-input-shell"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} disabled={loading} onChange={(event) => { setPassword(event.target.value); setError('') }} /><button className="password-toggle" type="button" onClick={() => setShowPassword((show) => !show)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button></div></div>
      <div className="login-field"><label htmlFor="confirm-password">Confirme a nova senha</label><div className="login-input-shell"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmation} disabled={loading} onChange={(event) => { setConfirmation(event.target.value); setError('') }} /></div></div>
      <p className="password-rule">Mínimo de 8 caracteres, incluindo maiúscula, minúscula, número e símbolo.</p>
      {error && <p className="login-error" role="alert"><span aria-hidden="true">!</span>{error}</p>}
      <button className="login-submit" type="submit" disabled={loading}>{loading ? 'Redefinindo…' : 'Redefinir senha'}</button>
    </form>
  </RecoveryLayout>
}
