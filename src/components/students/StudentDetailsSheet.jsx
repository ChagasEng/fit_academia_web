import { useState } from 'react'
import { createStudentWhatsappContact, estimateTravel } from '../../lib/api'
import StudentTypeBadge from './StudentTypeBadge'

export default function StudentDetailsSheet({ student, token, onClose }) {
  const [messageType, setMessageType] = useState('confirmacao')
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  const [whatsAppError, setWhatsAppError] = useState('')
  const [calculatingDistance, setCalculatingDistance] = useState(false)
  const [distanceEstimate, setDistanceEstimate] = useState(null)
  const [distanceError, setDistanceError] = useState('')
  const address = student.addresses?.[0]
  const phone = student.phones?.[0]
  const phoneDigits = phone?.numero?.replace(/\D/g, '') || ''
  const whatsappNumber = phoneDigits.length === 10 || phoneDigits.length === 11 ? `55${phoneDigits}` : phoneDigits
  const destination = address && [address.rua, address.numero, address.bairro, address.cidade, address.estado, address.cep].filter(Boolean).join(', ')
  const nextAppointment = student.proximo_agendamento
  const nextAppointmentLabel = nextAppointment && `${nextAppointment.type?.nome || nextAppointment.titulo} · ${new Date(nextAppointment.inicio).toLocaleDateString('pt-BR')} às ${new Date(nextAppointment.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  const lastContactLabel = student.ultimo_contato_em && new Date(student.ultimo_contato_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  const nextInstallment = (student.contracts || [])
    .flatMap((contract) => (contract.installments || []).map((installment) => ({ ...installment, contract })))
    .filter((installment) => !installment.pago_em)
    .sort((a, b) => String(a.vencimento_em || '').localeCompare(String(b.vencimento_em || '')))[0]

  function openRoute(provider) {
    const query = encodeURIComponent(destination)
    const url = provider === 'waze' ? `https://www.waze.com/ul?q=${query}&navigate=yes` : `https://www.google.com/maps/dir/?api=1&destination=${query}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  function openHistory() { window.history.pushState({}, '', `/personal/alunos/${student.id}/historico`); window.dispatchEvent(new PopStateEvent('popstate')) }

  function currentPosition() {
    if (!navigator.geolocation) return Promise.reject(new Error('Seu navegador não oferece localização para calcular a distância.'))
    return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    }))
  }

  async function calculateDistance() {
    try {
      setCalculatingDistance(true)
      setDistanceError('')
      const position = await currentPosition()
      const estimate = await estimateTravel(token, {
        origem_latitude: position.coords.latitude,
        origem_longitude: position.coords.longitude,
        local_tipo: 'domicilio',
        local_cep: address.cep,
        local_estado: address.estado,
        local_cidade: address.cidade,
        local_bairro: address.bairro,
        local_rua: address.rua,
        local_numero: address.numero,
        local_complemento: address.complemento,
      })
      setDistanceEstimate(estimate)
    } catch (error) {
      setDistanceError(error?.code === 1 ? 'Permita o acesso à sua localização para calcular a distância.' : error.message || 'Não foi possível calcular a distância agora.')
    } finally {
      setCalculatingDistance(false)
    }
  }

  async function openWhatsApp() {
    const popup = window.open('about:blank', '_blank')
    if (!popup) {
      setWhatsAppError('Permita pop-ups para abrir a conversa no WhatsApp.')
      return
    }

    try {
      setSendingWhatsApp(true)
      setWhatsAppError('')
      const response = await createStudentWhatsappContact(token, student.id, messageType, nextAppointment?.id)
      popup.location.href = response.whatsapp.url
    } catch (requestError) {
      popup.close()
      setWhatsAppError(requestError.message)
    } finally {
      setSendingWhatsApp(false)
    }
  }

  return <section className="student-sheet" role="dialog" aria-modal="true" aria-label="Dados do aluno">
    <div className="day-sheet-header"><div><p className="eyebrow">CADASTRO DO ALUNO</p><h2>{student.nome}</h2></div><button onClick={onClose} aria-label="Fechar dados">×</button></div>
    {nextInstallment && <div className="payment-reminder"><strong>Próximo pagamento: {(nextInstallment.valor_centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong><span>{nextInstallment.contract.titulo} · vence em {new Date(`${nextInstallment.vencimento_em}T12:00`).toLocaleDateString('pt-BR')}</span></div>}
    <dl className="student-details"><div><dt>Tipo</dt><dd><StudentTypeBadge type={student.type} /></dd></div><div><dt>E-mail</dt><dd>{student.email || 'Não informado'}</dd></div><div><dt>WhatsApp</dt><dd className="whatsapp-contact"><span>{phone?.numero || 'Não informado'}</span>{whatsappNumber && <span className="whatsapp-template-actions"><select value={messageType} onChange={(event) => setMessageType(event.target.value)} aria-label="Mensagem pronta"><option value="confirmacao">Confirmação</option><option value="lembrete">Lembrete</option><option value="cobranca">Cobrança</option></select><button type="button" onClick={openWhatsApp} disabled={sendingWhatsApp} aria-label={`Enviar ${messageType} pelo WhatsApp`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.3-4.7a8.5 8.5 0 1 1 16.2-4Z"/><path d="M8.2 7.7c.3-.6.6-.6.9-.6h.4l.7 1.8c.1.3 0 .5-.1.7l-.6.7c-.2.2-.1.4 0 .6.7 1.2 2.1 3 3 2.7.3.1.5.1.7-.1l.8-1c.2-.2.4-.3.7-.2l1.8.8c.3.1.4.3.4.5-.1.8-.5 1.5-1.1 2-.5.4-1.2.7-2.1.5-1.2-.3-2.8-.8-4.6-2.4-1.5-1.3-2.5-3-2.8-4.2-.2-.8 0-1.4.3-1.8.4-.5.8-.8 1-.9Z"/></svg><span className="sr-only">Enviar mensagem pelo WhatsApp</span></button></span>}</dd></div>{nextAppointmentLabel && <div className="full whatsapp-context"><dt>Próximo atendimento</dt><dd>{nextAppointmentLabel}</dd></div>}{lastContactLabel && <div className="full whatsapp-context"><dt>Último contato</dt><dd>{lastContactLabel}</dd></div>}{whatsAppError && <div className="full whatsapp-error" role="alert">{whatsAppError}</div>}<div><dt>Academia</dt><dd>{student.academy?.nome || 'Não vinculada'}</dd></div><div><dt>CEP</dt><dd>{address?.cep || 'Não informado'}</dd></div><div className="full"><dt>Endereço</dt><dd>{destination || 'Não informado'}</dd></div><div className="full"><dt>Complemento / referência</dt><dd>{[address?.complemento, address?.referencia].filter(Boolean).join(' · ') || 'Não informado'}</dd></div></dl>
    {distanceEstimate && <div className="current-distance" role="status"><strong>Você está a {(distanceEstimate.distance_meters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km do aluno.</strong><span>Tempo estimado de carro: {distanceEstimate.duration_minutes} min.</span></div>}
    {distanceError && <p className="form-error">{distanceError}</p>}
    <div className="route-actions"><button onClick={openHistory}>Ver histórico e pagamentos</button>{destination && <><button onClick={calculateDistance} disabled={calculatingDistance}>{calculatingDistance ? 'Calculando…' : 'Ver distância da minha localização'}</button><button onClick={() => openRoute('maps')}>Ir com Google Maps</button><button onClick={() => openRoute('waze')}>Ir com Waze</button></>}</div>
  </section>
}
