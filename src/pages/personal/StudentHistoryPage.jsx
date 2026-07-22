import { useCallback, useEffect, useState } from 'react'
import AppointmentLocationFields from '../../components/appointments/AppointmentLocationFields'
import AcademyPickerModal from '../../components/academies/AcademyPickerModal'
import BackButton from '../../components/navigation/BackButton'
import ChargeCreateSheet from '../../components/payments/ChargeCreateSheet'
import StudentQuickSearch from '../../components/students/StudentQuickSearch'
import {
  createStudentNote,
  getStudentHistory,
  markInstallmentPaid,
  updateAppointment,
  updateStudent,
} from '../../lib/api'
import { appointmentLocationLabel, locationFromAppointment } from '../../lib/appointmentLocation'
import { formatCalendarDate } from '../../lib/text'

const money = (value = 0) => (Number(value || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const historyCache = new Map()

function cacheHistory(studentId, history) {
  historyCache.delete(String(studentId))
  historyCache.set(String(studentId), history)
  if (historyCache.size > 20) historyCache.delete(historyCache.keys().next().value)
}

export default function StudentHistoryPage({ token, onLogout, studentId }) {
  const [data, setData] = useState(() => historyCache.get(String(studentId)) || null)
  const [error, setError] = useState('')
  const [savingLocation, setSavingLocation] = useState(false)
  const [note, setNote] = useState('')
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [location, setLocation] = useState(null)
  const [showStudentAcademies, setShowStudentAcademies] = useState(false)
  const [showCharge, setShowCharge] = useState(false)

  const load = useCallback(async () => {
    try {
      setError('')
      const history = await getStudentHistory(token, studentId)
      cacheHistory(studentId, history)
      setData(history)
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [token, studentId])

  useEffect(() => { load() }, [load])

  function editAppointment(appointment) {
    setEditingAppointment(appointment.id)
    setLocation(locationFromAppointment(appointment))
    setError('')
  }

  async function saveAppointmentLocation(event) {
    event.preventDefault()
    try {
      setSavingLocation(true)
      setError('')
      await updateAppointment(token, editingAppointment, location)
      setEditingAppointment(null)
      setLocation(null)
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingLocation(false)
    }
  }

  async function selectStudentAcademy(academy) {
    try {
      setError('')
      await updateStudent(token, studentId, { academia_id: academy.id })
      setShowStudentAcademies(false)
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function removeStudentAcademy() {
    try {
      setError('')
      await updateStudent(token, studentId, { academia_id: null })
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (error && !data) {
    return (
      <main className="dashboard-page">
        <header className="dashboard-header">
          <div className="header-side"><BackButton fallback="/personal/alunos" /><strong>fit<span>academia</span></strong></div><div className="header-actions"><StudentQuickSearch token={token} /><button onClick={onLogout}>Sair</button></div>
        </header>
        <section className="registration-content">
          <p className="form-error">{error}</p>
          <button onClick={load}>Tentar novamente</button>
        </section>
      </main>
    )
  }

  if (!data) return <main className="dashboard-page registration-page">
    <header className="dashboard-header">
      <div className="header-side"><BackButton fallback="/personal/alunos" /><strong>fit<span>academia</span></strong></div>
      <div className="header-actions"><StudentQuickSearch token={token} /><button onClick={onLogout}>Sair</button></div>
    </header>
    <section className="registration-content history-loading" aria-busy="true" aria-label="Carregando histórico do aluno">
      <p className="eyebrow">HISTÓRICO DO ALUNO</p>
      <h1>{window.history.state?.studentName || 'Histórico do aluno'}</h1>
      <p>Buscando pagamentos, planos e atendimentos…</p>
      <div className="history-loading-summary" />
      <div className="history-loading-grid"><span /><span /></div>
    </section>
  </main>

  const contracts = Array.isArray(data.contracts) ? data.contracts : []
  const appointments = Array.isArray(data.appointments) ? data.appointments : []
  const notes = Array.isArray(data.notes) ? data.notes : []
  const installments = contracts.flatMap((contract) => (contract.installments || []).map((installment) => ({ ...installment, contract })))
  const nextAppointment = appointments
    .filter((appointment) => appointment.status === 'agendado' && new Date(appointment.inicio) >= new Date())
    .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))[0]

  return (
    <main className="dashboard-page registration-page">
      <header className="dashboard-header">
        <div className="header-side"><BackButton fallback="/personal/alunos" /><strong>fit<span>academia</span></strong></div>
        <div className="header-actions"><StudentQuickSearch token={token} /><button onClick={onLogout}>Sair</button></div>
      </header>

      <section className="registration-content history-page">
        <p className="eyebrow">HISTÓRICO DO ALUNO</p>
        <h1>{data.student.nome}</h1>
        <p>Atendimentos, locais, plano fechado e pagamentos em um só lugar.</p>

        <div className="student-academy-summary">
          <div><span>ACADEMIA PRINCIPAL</span><strong>{data.student.academy?.nome || 'Nenhuma academia vinculada'}</strong><small>{data.student.academy?.endereco || 'Escolha no mapa para organizar alunos e agendamentos por academia.'}</small></div>
          <div className="student-academy-actions"><button type="button" onClick={() => setShowStudentAcademies(true)}>{data.student.academy ? 'Alterar academia' : 'Escolher academia'}</button>{data.student.academy && <button type="button" className="secondary-button" onClick={removeStudentAcademy}>Remover</button>}</div>
        </div>

        {nextAppointment ? (
          <div className="appointment-summary">
            <span>PRÓXIMO AGENDAMENTO</span>
            <strong>
              {nextAppointment.type?.nome} · {new Date(nextAppointment.inicio).toLocaleDateString('pt-BR')} às {new Date(nextAppointment.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </strong>
            <small>📍 {appointmentLocationLabel(nextAppointment)}</small>
          </div>
        ) : (
          <div className="appointment-summary empty"><span>AGENDA</span><strong>Nenhum próximo agendamento.</strong></div>
        )}

        {error && <p className="form-error">{error}</p>}

        <section className="history-card history-payments-card">
          <div className="history-payments-heading"><div><span>FINANCEIRO</span><h2>Cobranças e pagamentos</h2></div><button type="button" onClick={() => setShowCharge(true)}>+ Nova cobrança</button></div>
          {installments.length === 0 && <p>Nenhuma parcela cadastrada.</p>}
          {installments.map((item) => (
            <article className="payment-row" key={item.id}>
              <div>
                <strong>{item.contract.titulo} · {item.numero}ª parcela</strong>
                <span>Vence {formatCalendarDate(item.vencimento_em)} · {item.metodo_pagamento}</span>
              </div>
              <b>{money(item.valor_centavos)}</b>
              {item.pago_em ? (
                <em>Pago em {new Date(item.pago_em).toLocaleDateString('pt-BR')}</em>
              ) : (
                <button onClick={async () => {
                  try { await markInstallmentPaid(token, item.id); await load() }
                  catch (requestError) { setError(requestError.message) }
                }}>Já pagou</button>
              )}
            </article>
          ))}
        </section>

        <section className="history-card">
          <h2>Observações e atendimentos</h2>
          <form className="note-form" onSubmit={async (event) => {
            event.preventDefault()
            if (!note.trim()) return
            try {
              await createStudentNote(token, studentId, note.trim())
              setNote('')
              await load()
            } catch (requestError) {
              setError(requestError.message)
            }
          }}>
            <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Adicionar observação rápida" />
            <button>Adicionar</button>
          </form>

          {notes.map((item) => <p className="timeline-note" key={item.id}>{item.conteudo}</p>)}
          {appointments.map((item) => (
            <article className="timeline-appointment" key={`appointment-${item.id}`}>
              <div className="timeline-appointment-heading">
                <div>
                  <strong>{item.type?.nome}</strong>
                  <span>{new Date(item.inicio).toLocaleDateString('pt-BR')} às {new Date(item.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <button type="button" onClick={() => editAppointment(item)}>Editar local</button>
              </div>
              <p>📍 {appointmentLocationLabel(item)}</p>
              {item.observacao && <p>{item.observacao}</p>}

              {editingAppointment === item.id && location && (
                <form className="appointment-location-editor" onSubmit={saveAppointmentLocation}>
                  <AppointmentLocationFields token={token} value={location} onChange={setLocation} />
                  <div className="editor-actions">
                    <button type="button" className="secondary-button" onClick={() => { setEditingAppointment(null); setLocation(null) }}>Cancelar</button>
                    <button type="submit" disabled={savingLocation}>{savingLocation ? 'Salvando…' : 'Salvar local'}</button>
                  </div>
                </form>
              )}
            </article>
          ))}
        </section>
        {showStudentAcademies && <AcademyPickerModal token={token} selectedId={data.student.academy?.id} onSelect={selectStudentAcademy} onClose={() => setShowStudentAcademies(false)} />}
        {showCharge && <ChargeCreateSheet token={token} fixedStudent={data.student} onClose={() => setShowCharge(false)} onSaved={async () => { setShowCharge(false); await load() }} />}
      </section>
    </main>
  )
}
