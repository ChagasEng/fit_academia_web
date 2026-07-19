import { useState } from 'react'
import { login } from '../../lib/api'

function Brand() {
  return <div className="brand" aria-label="Fit Academia"><span className="brand-mark" aria-hidden="true">F</span><span>fit<span>academia</span></span></div>
}

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email || !password) return setError('Informe seu e-mail e sua senha para continuar.')

    setLoading(true)
    setError('')
    try {
      onLogin(await login({ email, password }))
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
      <div className="mobile-brand"><Brand /></div>
      <div className="form-heading">
        <p className="eyebrow">ACESSO À PLATAFORMA</p>
        <h2 id="login-title">Acesse sua conta</h2>
        <p>Informe seus dados para continuar.</p>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} />
        <label htmlFor="password">Senha</label>
        <input id="password" type="password" autoComplete="current-password" placeholder="Digite sua senha" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </section>
  </main>
}
