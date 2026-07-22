import { useEffect, useState } from 'react'
import BackButton from '../../components/navigation/BackButton'
import StudentQuickSearch from '../../components/students/StudentQuickSearch'
import {
  connectTelegramBot,
  disconnectTelegramBot,
  getTelegramIntegration,
  updateTelegramSettings,
  validateTelegramBot,
} from '../../lib/api'

const fallbackInstructions = [
  'Abra uma conversa com @BotFather no Telegram.',
  'Envie /newbot, escolha o nome e o username do bot.',
  'Copie o token recebido e use Validar bot antes de conectar.',
  'Após conectar, abra o bot e envie /start para autorizar seu chat.',
]

function formatDate(value) {
  if (!value) return 'Ainda não recebeu mensagens'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function TelegramIntegrationPage({ token, onLogout }) {
  const [integration, setIntegration] = useState(null)
  const [instructions, setInstructions] = useState(fallbackInstructions)
  const [botToken, setBotToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [validatedBot, setValidatedBot] = useState(null)
  const [autoConfirm, setAutoConfirm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const response = await getTelegramIntegration(token)
      setIntegration(response.integration)
      setAutoConfirm(Boolean(response.integration?.telegram_auto_confirm))
      if (response.instructions?.length) setInstructions(response.instructions)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token])

  function changeToken(value) {
    setBotToken(value.trim())
    setValidatedBot(null)
    setMessage('')
    setError('')
  }

  async function validate() {
    if (!botToken) return setError('Cole o token fornecido pelo BotFather.')
    setAction('validate')
    setMessage('')
    setError('')
    try {
      const response = await validateTelegramBot(token, botToken)
      setValidatedBot(response)
      setMessage('Bot validado. Confira o nome e conecte quando estiver pronto.')
    } catch (requestError) {
      setValidatedBot(null)
      setError(requestError.message)
    } finally {
      setAction('')
    }
  }

  async function connect() {
    if (!validatedBot) return setError('Valide o token antes de conectar.')
    setAction('connect')
    setMessage('')
    setError('')
    try {
      const response = await connectTelegramBot(token, botToken, autoConfirm)
      setIntegration(response.integration)
      setAutoConfirm(Boolean(response.integration.telegram_auto_confirm))
      setBotToken('')
      setValidatedBot(null)
      setMessage('Bot conectado. Agora abra a conversa no Telegram e envie /start.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setAction('')
    }
  }

  async function changeAutoConfirm(checked) {
    const previous = autoConfirm
    setAutoConfirm(checked)
    setAction('settings')
    setMessage('')
    setError('')
    try {
      const response = await updateTelegramSettings(token, checked)
      setIntegration(response.integration)
      setMessage('Preferência de confirmação atualizada.')
    } catch (requestError) {
      setAutoConfirm(previous)
      setError(requestError.message)
    } finally {
      setAction('')
    }
  }

  async function disconnect() {
    if (!window.confirm('Desconectar este bot? Ele deixará de receber novos agendamentos.')) return
    setAction('disconnect')
    setMessage('')
    setError('')
    try {
      await disconnectTelegramBot(token)
      setIntegration(null)
      setAutoConfirm(false)
      setMessage('Bot desconectado com sucesso.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setAction('')
    }
  }

  async function copyWebhook() {
    try {
      await navigator.clipboard.writeText(integration.webhook_url)
      setMessage('Endereço do webhook copiado.')
    } catch {
      setError('Não foi possível copiar o endereço automaticamente.')
    }
  }

  const connected = Boolean(integration?.is_active)
  const botLink = integration?.bot_username ? `https://t.me/${integration.bot_username}` : null

  return (
    <main className="dashboard-page telegram-page">
      <header className="dashboard-header">
        <div className="header-side"><BackButton fallback="/personal/perfil" /><strong>fit<span>academia</span></strong></div>
        <div className="header-actions"><StudentQuickSearch token={token} /><button onClick={onLogout}>Sair</button></div>
      </header>

      <section className="telegram-content">
        <div className="telegram-heading">
          <div>
            <p className="eyebrow">INTEGRAÇÕES</p>
            <h1>Agenda pelo Telegram</h1>
            <p>Conecte seu próprio bot para criar agendamentos por conversa, com acesso exclusivo à sua agenda.</p>
          </div>
          <div className={`telegram-status ${connected ? 'connected' : ''}`}>
            <span aria-hidden="true">{connected ? '✓' : '•'}</span>
            <div><small>STATUS</small><strong>{connected ? 'Conectado' : 'Não conectado'}</strong></div>
          </div>
        </div>

        {loading && <div className="telegram-loading">Carregando integração…</div>}

        {!loading && connected && (
          <div className="telegram-layout">
            <section className="telegram-card telegram-bot-card">
              <div className="telegram-bot-identity">
                <span className="telegram-logo" aria-hidden="true">▷</span>
                <div><small>BOT CONECTADO</small><h2>{integration.bot_name || 'Bot do Telegram'}</h2>{botLink && <a href={botLink} target="_blank" rel="noreferrer">@{integration.bot_username} ↗</a>}</div>
              </div>

              <div className="telegram-facts">
                <div><span>Webhook</span><strong className="telegram-good">● Ativo</strong></div>
                <div><span>Seu chat</span><strong className={integration.chat_authorized ? 'telegram-good' : 'telegram-waiting'}>{integration.chat_authorized ? '✓ Autorizado' : '○ Aguardando /start'}</strong></div>
                <div><span>Última mensagem</span><strong>{formatDate(integration.last_update_at)}</strong></div>
              </div>

              {!integration.chat_authorized && <div className="telegram-callout"><strong>Falta só uma etapa</strong><span>Abra o bot no Telegram, toque em Iniciar e envie <code>/start</code>.</span>{botLink && <a href={botLink} target="_blank" rel="noreferrer">Abrir meu bot</a>}</div>}

              <div className="telegram-setting">
                <div><strong>Confirmar automaticamente</strong><span>Cria o agendamento assim que você confirma os dados no Telegram.</span></div>
                <label className="telegram-switch">
                  <input type="checkbox" checked={autoConfirm} disabled={action === 'settings'} onChange={(event) => changeAutoConfirm(event.target.checked)} />
                  <span aria-hidden="true" />
                  <em className="sr-only">Confirmação automática</em>
                </label>
              </div>
            </section>

            <aside className="telegram-card telegram-technical-card">
              <span className="telegram-card-label">CONEXÃO</span>
              <h2>Detalhes técnicos</h2>
              <p>O token fica criptografado no servidor e nunca volta para esta tela.</p>
              <label>Endereço do webhook<div className="telegram-copy-field"><input readOnly value={integration.webhook_url || ''} /><button type="button" onClick={copyWebhook}>Copiar</button></div></label>
              <button type="button" className="telegram-danger" disabled={action === 'disconnect'} onClick={disconnect}>{action === 'disconnect' ? 'Desconectando…' : 'Desconectar bot'}</button>
            </aside>
          </div>
        )}

        {!loading && !connected && (
          <div className="telegram-layout">
            <section className="telegram-card telegram-connect-card">
              <span className="telegram-card-label">CONECTAR BOT</span>
              <h2>Cole o token do BotFather</h2>
              <p>O token funciona como uma senha. Não envie para outras pessoas.</p>
              <label>Token do bot<div className="telegram-token-field"><input type={showToken ? 'text' : 'password'} autoComplete="off" spellCheck="false" placeholder="0000000000:AA..." value={botToken} onChange={(event) => changeToken(event.target.value)} /><button type="button" onClick={() => setShowToken((value) => !value)}>{showToken ? 'Ocultar' : 'Mostrar'}</button></div></label>
              <button type="button" className="telegram-secondary" disabled={!botToken || Boolean(action)} onClick={validate}>{action === 'validate' ? 'Validando…' : 'Validar bot'}</button>

              {validatedBot && <div className="telegram-validation"><span className="telegram-logo" aria-hidden="true">✓</span><div><small>BOT ENCONTRADO</small><strong>{validatedBot.bot_name}</strong><span>@{validatedBot.bot_username}</span></div></div>}

              {validatedBot && <button type="button" disabled={Boolean(action)} onClick={connect}>{action === 'connect' ? 'Conectando…' : 'Conectar à minha agenda'}</button>}
            </section>

            <aside className="telegram-card telegram-steps-card">
              <span className="telegram-card-label">PASSO A PASSO</span>
              <h2>Como obter o token</h2>
              <ol>{instructions.map((instruction, index) => <li key={instruction}><span>{index + 1}</span><p>{instruction}</p></li>)}</ol>
              <a href="https://t.me/BotFather" target="_blank" rel="noreferrer">Abrir @BotFather ↗</a>
            </aside>
          </div>
        )}

        {message && <p className="telegram-feedback success" role="status">{message}</p>}
        {error && <p className="telegram-feedback error" role="alert">{error}</p>}
      </section>
    </main>
  )
}
