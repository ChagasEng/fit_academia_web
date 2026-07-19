import { useState } from 'react'
import { login } from '../../lib/api'

function Brand() {
  return <div className="brand" aria-label="Fit Academia"><span className="brand-mark" aria-hidden="true">F</span><span>fit<span>academia</span></span></div>
}

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const normalizedEmail = email.trim()
    if (!normalizedEmail || !password) return setError('Informe seu e-mail e sua senha para continuar.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return setError('Informe um endereço de e-mail válido.')

    setLoading(true)
    setError('')
    try {
      onLogin(await login({ email: normalizedEmail, password }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-page">
    <section className="presentation" aria-hidden="true">
      <Brand />
      <div className="presentation-copy">
        <p className="eyebrow">BEM-VINDO À FIT ACADEMIA</p>
        <h1>Seu ritmo.<br />Sua evolução.</h1>
        <p>Uma plataforma para conectar pessoas, resultados e bem-estar.</p>
      </div>
      <p className="presentation-footer">© {new Date().getFullYear()} Fit Academia</p>
    </section>
    <section className="login-panel" aria-labelledby="login-title">
      <div className="mobile-login-hero">
        <Brand />
        <div><strong>Seu trabalho organizado.</strong><span>Agenda, alunos e resultados em um só lugar.</span></div>
      </div>
      <div className="login-card">
        <div className="form-heading">
          <p className="eyebrow">BEM-VINDO DE VOLTA</p>
          <h2 id="login-title">Acesse sua conta</h2>
          <p>Entre para continuar sua rotina de atendimentos.</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
          <div className="login-field">
            <label htmlFor="email">E-mail</label>
            <div className="login-input-shell">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16v11H4z"/><path d="m4.5 7 7.5 6 7.5-6"/></svg>
              <input id="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck="false" placeholder="voce@exemplo.com" value={email} disabled={loading} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} onChange={(event) => { setEmail(event.target.value); if (error) setError('') }} />
            </div>
          </div>
          <div className="login-field">
            <label htmlFor="password">Senha</label>
            <div className="login-input-shell">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
              <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Digite sua senha" value={password} disabled={loading} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} onChange={(event) => { setPassword(event.target.value); if (error) setError('') }} />
              <button className="password-toggle" type="button" disabled={loading} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? 'Ocultar' : 'Mostrar'}</button>
            </div>
          </div>
          {error && <p className="login-error" id="login-error" role="alert"><span aria-hidden="true">!</span>{error}</p>}
          <button className="login-submit" type="submit" disabled={loading}>
            <span>{loading ? 'Entrando…' : 'Entrar'}</span>
            {!loading && <span aria-hidden="true">→</span>}
            {loading && <span className="login-spinner" aria-hidden="true" />}
          </button>
          <p className="login-session-note"><span aria-hidden="true">✓</span>Sua sessão permanece conectada neste aparelho.</p>
        </form>
      </div>
      <p className="mobile-login-footer">© {new Date().getFullYear()} Fit Academia</p>
    </section>
  </main>
}
