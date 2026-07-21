import { useEffect, useState } from 'react'
import AcademyPickerModal from '../academies/AcademyPickerModal'
import { createStudentWhatsappContact, estimateTravel, updateStudent } from '../../lib/api'
import { formatCep, formatPhone, onlyDigits } from '../../lib/masks'
import { formatCalendarDate } from '../../lib/text'
import StudentTypeBadge from './StudentTypeBadge'
import StudentDeactivationModal from './StudentDeactivationModal'

const emptyAddress = { cep: '', estado: '', cidade: '', bairro: '', rua: '', numero: '', complemento: '', referencia: '' }

function formFromStudent(student) {
  const address = student.addresses?.[0] || emptyAddress
  return {
    nome: student.nome || '',
    email: student.email || '',
    usuario_tipo_id: student.usuario_tipo_id || 4,
    telefone: student.phones?.[0]?.numero || '',
    endereco: { ...emptyAddress, ...address },
    academia_id: student.academia_id || student.academy?.id || null,
    academy: student.academy || null,
  }
}

export default function StudentDetailsSheet({ student, token, onClose, onUpdated }) {
  const [currentStudent, setCurrentStudent] = useState(student)
  const [messageType, setMessageType] = useState('confirmacao')
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  const [whatsAppError, setWhatsAppError] = useState('')
  const [calculatingDistance, setCalculatingDistance] = useState(false)
  const [distanceEstimate, setDistanceEstimate] = useState(null)
  const [distanceError, setDistanceError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(() => formFromStudent(student))
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')
  const [showAcademies, setShowAcademies] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [showDeactivation, setShowDeactivation] = useState(false)

  useEffect(() => {
    setCurrentStudent(student)
    setEditForm(formFromStudent(student))
  }, [student])

  const address = currentStudent.addresses?.[0]
  const phone = currentStudent.phones?.[0]
  const phoneDigits = phone?.numero?.replace(/\D/g, '') || ''
  const whatsappNumber = phoneDigits.length === 10 || phoneDigits.length === 11 ? `55${phoneDigits}` : phoneDigits
  const destination = address && [address.rua, address.numero, address.bairro, address.cidade, address.estado, address.cep].filter(Boolean).join(', ')
  const nextAppointment = currentStudent.proximo_agendamento
  const nextAppointmentLabel = nextAppointment && `${nextAppointment.type?.nome || nextAppointment.titulo} · ${new Date(nextAppointment.inicio).toLocaleDateString('pt-BR')} às ${new Date(nextAppointment.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  const lastContactLabel = currentStudent.ultimo_contato_em && new Date(currentStudent.ultimo_contato_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  const nextInstallment = (currentStudent.contracts || [])
    .flatMap((contract) => (contract.installments || []).map((installment) => ({ ...installment, contract })))
    .filter((installment) => !installment.pago_em)
    .sort((a, b) => String(a.vencimento_em || '').localeCompare(String(b.vencimento_em || '')))[0]

  function openRoute(provider) {
    const query = encodeURIComponent(destination)
    const url = provider === 'waze' ? `https://www.waze.com/ul?q=${query}&navigate=yes` : `https://www.google.com/maps/dir/?api=1&destination=${query}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function openHistory() {
    window.history.pushState({}, '', `/personal/alunos/${currentStudent.id}/historico`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

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
      const response = await createStudentWhatsappContact(token, currentStudent.id, messageType, nextAppointment?.id)
      popup.location.href = response.whatsapp.url
    } catch (requestError) {
      popup.close()
      setWhatsAppError(requestError.message)
    } finally {
      setSendingWhatsApp(false)
    }
  }

  function startEditing() {
    setEditError('')
    setEditForm(formFromStudent(currentStudent))
    setEditing(true)
  }

  function updateAddress(field, value) {
    setEditForm((form) => ({ ...form, endereco: { ...form.endereco, [field]: value } }))
  }

  async function saveEditing(event) {
    event.preventDefault()
    try {
      setSavingEdit(true)
      setEditError('')
      const updated = await updateStudent(token, currentStudent.id, {
        nome: editForm.nome,
        email: editForm.email || null,
        usuario_tipo_id: Number(editForm.usuario_tipo_id),
        academia_id: editForm.academia_id || null,
        telefone: { numero: onlyDigits(editForm.telefone).slice(0, 13), tipo: 'whatsapp' },
        endereco: editForm.endereco,
      })
      setCurrentStudent(updated)
      onUpdated?.(updated)
      setEditing(false)
    } catch (requestError) {
      setEditError(requestError.message)
    } finally {
      setSavingEdit(false)
    }
  }

  async function updateStatus(active, reason = null) {
    try {
      setSavingStatus(true)
      setStatusError('')
      const updated = await updateStudent(token, currentStudent.id, { ativo: active ? 1 : 0, ...(reason ? { motivo_inativacao: reason } : {}) })
      setCurrentStudent(updated)
      onUpdated?.(updated)
      setShowDeactivation(false)
    } catch (requestError) {
      setStatusError(requestError.message)
    } finally {
      setSavingStatus(false)
    }
  }

  function toggleStatus() {
    if (currentStudent.ativo) {
      setStatusError('')
      setShowDeactivation(true)
      return
    }
    updateStatus(true)
  }

  return <section className="student-sheet" role="dialog" aria-modal="true" aria-label="Dados do aluno">
    <div className="day-sheet-header"><div><p className="eyebrow">CADASTRO DO ALUNO</p><h2>{currentStudent.nome}</h2></div><button onClick={onClose} aria-label="Fechar dados">×</button></div>
    <div className={`student-profile-status ${currentStudent.ativo ? 'active' : 'inactive'}`}><span aria-hidden="true">{currentStudent.ativo ? '●' : '○'}</span><div><small>STATUS DO ALUNO</small><strong>{currentStudent.ativo ? 'Ativo na sua carteira' : 'Aluno inativo'}</strong><em>{currentStudent.ativo ? 'Disponível para novos agendamentos.' : currentStudent.motivo_inativacao || 'Cadastro e histórico continuam preservados.'}</em>{!currentStudent.ativo && currentStudent.inativado_em && <small className="student-inactive-date">Inativado em {new Date(currentStudent.inativado_em).toLocaleDateString('pt-BR')}</small>}</div><button type="button" disabled={savingStatus} onClick={toggleStatus}>{savingStatus ? 'Salvando…' : currentStudent.ativo ? 'Inativar aluno' : 'Reativar aluno'}</button></div>
    {statusError && <p className="form-error" role="alert">{statusError}</p>}
    {nextInstallment && <div className="payment-reminder"><strong>Próximo pagamento: {(nextInstallment.valor_centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong><span>{nextInstallment.contract.titulo} · vence em {formatCalendarDate(nextInstallment.vencimento_em)}</span></div>}
    {!editing ? <>
      <dl className="student-details"><div><dt>Tipo</dt><dd><StudentTypeBadge type={currentStudent.type} /></dd></div><div><dt>E-mail</dt><dd>{currentStudent.email || 'Não informado'}</dd></div><div><dt>WhatsApp</dt><dd className="whatsapp-contact"><span>{phone?.numero || 'Não informado'}</span>{whatsappNumber && <span className="whatsapp-template-actions"><select value={messageType} onChange={(event) => setMessageType(event.target.value)} aria-label="Mensagem pronta"><option value="confirmacao">Confirmação</option><option value="lembrete">Lembrete</option><option value="cobranca">Cobrança</option></select><button type="button" onClick={openWhatsApp} disabled={sendingWhatsApp} aria-label={`Enviar ${messageType} pelo WhatsApp`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.3-4.7a8.5 8.5 0 1 1 16.2-4Z"/><path d="M8.2 7.7c.3-.6.6-.6.9-.6h.4l.7 1.8c.1.3 0 .5-.1.7l-.6.7c-.2.2-.1.4 0 .6.7 1.2 2.1 3 3 2.7.3.1.5.1.7-.1l.8-1c.2-.2.4-.3.7-.2l1.8.8c.3.1.4.3.4.5-.1.8-.5 1.5-1.1 2-.5.4-1.2.7-2.1.5-1.2-.3-2.8-.8-4.6-2.4-1.5-1.3-2.5-3-2.8-4.2-.2-.8 0-1.4.3-1.8.4-.5.8-.8 1-.9Z"/></svg><span className="sr-only">Enviar mensagem pelo WhatsApp</span></button></span>}</dd></div>{nextAppointmentLabel && <div className="full whatsapp-context"><dt>Próximo atendimento</dt><dd>{nextAppointmentLabel}</dd></div>}{lastContactLabel && <div className="full whatsapp-context"><dt>Último contato</dt><dd>{lastContactLabel}</dd></div>}{whatsAppError && <div className="full whatsapp-error" role="alert">{whatsAppError}</div>}<div><dt>Academia</dt><dd>{currentStudent.academy?.nome || 'Não vinculada'}</dd></div><div><dt>CEP</dt><dd>{address?.cep || 'Não informado'}</dd></div><div className="full"><dt>Endereço</dt><dd>{destination || 'Não informado'}</dd></div><div className="full"><dt>Complemento / referência</dt><dd>{[address?.complemento, address?.referencia].filter(Boolean).join(' · ') || 'Não informado'}</dd></div></dl>
      <div className="student-main-actions">
        <button type="button" className="student-action-card action-edit" onClick={startEditing}><ActionIcon name="edit" /><span><strong>Editar cadastro</strong><small>Dados, contato e endereço</small></span><b aria-hidden="true">›</b></button>
        <button type="button" className="student-action-card" onClick={openHistory}><ActionIcon name="history" /><span><strong>Histórico e pagamentos</strong><small>Planos, parcelas e atendimentos</small></span><b aria-hidden="true">›</b></button>
      </div>
      {destination && <section className="student-route-panel">
        <header><div><span>DESLOCAMENTO</span><strong>Como chegar até o aluno</strong></div><ActionIcon name="route" /></header>
        <button type="button" className="distance-action" onClick={calculateDistance} disabled={calculatingDistance}><ActionIcon name="location" /><span><strong>{calculatingDistance ? 'Calculando distância…' : 'Calcular distância agora'}</strong><small>Usa sua localização atual e mostra o tempo de carro</small></span></button>
        {distanceEstimate && <div className="current-distance" role="status"><strong>{(distanceEstimate.distance_meters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km · cerca de {distanceEstimate.duration_minutes} min</strong><span>Estimativa saindo da sua localização atual.</span></div>}
        {distanceError && <p className="form-error">{distanceError}</p>}
        <div className="route-provider-actions"><button type="button" className="maps-action" onClick={() => openRoute('maps')}><ActionIcon name="maps" /><span><strong>Google Maps</strong><small>Abrir rota</small></span></button><button type="button" className="waze-action" onClick={() => openRoute('waze')}><ActionIcon name="waze" /><span><strong>Waze</strong><small>Iniciar navegação</small></span></button></div>
      </section>}
    </> : <form className="student-edit-form" onSubmit={saveEditing}>
      <h3>Editar dados</h3>
      <div className="form-grid"><Field label="Nome completo" value={editForm.nome} onChange={(value) => setEditForm((form) => ({ ...form, nome: value }))} required /><Field label="E-mail" type="email" value={editForm.email} onChange={(value) => setEditForm((form) => ({ ...form, email: value }))} /><label>Tipo<select value={editForm.usuario_tipo_id} onChange={(event) => setEditForm((form) => ({ ...form, usuario_tipo_id: Number(event.target.value) }))}><option value={4}>Aluno recorrente</option><option value={5}>Aluno avulso</option></select></label><Field label="WhatsApp" type="tel" inputMode="tel" value={formatPhone(editForm.telefone)} onChange={(value) => setEditForm((form) => ({ ...form, telefone: onlyDigits(value).slice(0, 13) }))} required /></div>
      <h3>Endereço</h3>
      <div className="form-grid"><Field label="CEP" inputMode="numeric" maxLength={9} value={formatCep(editForm.endereco.cep)} onChange={(value) => updateAddress('cep', onlyDigits(value).slice(0, 8))} /><Field label="Estado" maxLength={2} value={editForm.endereco.estado} onChange={(value) => updateAddress('estado', value.replace(/[^a-z]/gi, '').toUpperCase())} /><Field label="Cidade" value={editForm.endereco.cidade} onChange={(value) => updateAddress('cidade', value)} /><Field label="Bairro" value={editForm.endereco.bairro} onChange={(value) => updateAddress('bairro', value)} /><Field label="Rua" value={editForm.endereco.rua} onChange={(value) => updateAddress('rua', value)} /><Field label="Número" value={editForm.endereco.numero} onChange={(value) => updateAddress('numero', value)} /><Field label="Complemento" value={editForm.endereco.complemento} onChange={(value) => updateAddress('complemento', value)} /><Field label="Referência" value={editForm.endereco.referencia} onChange={(value) => updateAddress('referencia', value)} /></div>
      <button type="button" className="academy-picker-trigger" onClick={() => setShowAcademies(true)}><span aria-hidden="true">⌖</span><span><small>ACADEMIA PRINCIPAL</small><strong>{editForm.academy?.nome || 'Escolher academia'}</strong></span><b>›</b></button>
      {editForm.academy && <button type="button" className="remove-academy" onClick={() => setEditForm((form) => ({ ...form, academy: null, academia_id: null }))}>Remover vínculo com {editForm.academy.nome}</button>}
      {editError && <p className="form-error">{editError}</p>}<div className="student-edit-actions"><button type="button" className="secondary-button" onClick={() => setEditing(false)}>Cancelar</button><button disabled={savingEdit}>{savingEdit ? 'Salvando…' : 'Salvar alterações'}</button></div>
    </form>}
    {showAcademies && <AcademyPickerModal token={token} selectedId={editForm.academia_id} onSelect={(academy) => setEditForm((form) => ({ ...form, academy, academia_id: academy.id }))} onClose={() => setShowAcademies(false)} />}
    {showDeactivation && <StudentDeactivationModal student={currentStudent} saving={savingStatus} error={statusError} onClose={() => !savingStatus && setShowDeactivation(false)} onConfirm={(reason) => updateStatus(false, reason)} />}
  </section>
}

function Field({ label, type = 'text', value, onChange, required, ...inputProps }) {
  return <label>{label}<input {...inputProps} type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} /></label>
}

function ActionIcon({ name }) {
  const paths = {
    edit: <><path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></>,
    history: <><path d="M4 5h16v15H4z"/><path d="M8 3h8v4H8zM8 11h8M8 15h5"/></>,
    route: <><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3"/></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    maps: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/></>,
    waze: <><path d="M5 15a7 7 0 1 1 4 4H6a3 3 0 0 1-3-3v-1h2Z"/><circle cx="10" cy="11" r=".8"/><circle cx="15" cy="11" r=".8"/><path d="M10 15c1.2 1 3.8 1 5 0"/></>,
  }
  return <svg className="student-action-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}
