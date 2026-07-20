import { useState } from 'react'
import { getPersonalSubscription } from '../../lib/api'

export default function SubscriptionBlockedPage({ token, subscription, onReactivated, onLogout }) {
  const [status, setStatus] = useState(subscription)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('')

  async function checkPayment() {
    setChecking(true)
    setMessage('')
    try {
      const current = await getPersonalSubscription(token)
      setStatus(current)
      if (current.acesso_liberado) return onReactivated()
      setMessage('O pagamento ainda não foi confirmado pelo administrador.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setChecking(false)
    }
  }

  return <main className="subscription-blocked-page">
    <section>
      <span className="subscription-lock" aria-hidden="true">!</span>
      <p className="eyebrow">ACESSO TEMPORARIAMENTE BLOQUEADO</p>
      <h1>Mensalidade pendente</h1>
      <p>O período de carência terminou. Entre em contato com o administrador para regularizar a mensalidade e liberar novamente seu acesso.</p>
      {status?.carencia_ate && <div className="subscription-blocked-info"><span>Carência encerrada em</span><strong>{new Date(`${status.carencia_ate}T00:00:00`).toLocaleDateString('pt-BR')}</strong></div>}
      {message && <p className="form-error" role="status">{message}</p>}
      <button type="button" onClick={checkPayment} disabled={checking}>{checking ? 'Verificando...' : 'Já paguei — verificar acesso'}</button>
      <button className="secondary-button" type="button" onClick={onLogout}>Sair da conta</button>
    </section>
  </main>
}
