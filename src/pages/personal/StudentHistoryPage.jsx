import { useCallback, useEffect, useState } from 'react'
import AppointmentLocationFields from '../../components/appointments/AppointmentLocationFields'
import AcademyPickerModal from '../../components/academies/AcademyPickerModal'
import BackButton from '../../components/navigation/BackButton'
import StudentQuickSearch from '../../components/students/StudentQuickSearch'
import {
  createContract,
  createStudentNote,
  getStudentHistory,
  markInstallmentPaid,
  updateAppointment,
  updateStudent,
} from '../../lib/api'
import { appointmentLocationLabel, locationFromAppointment } from '../../lib/appointmentLocation'
import { currencyToCents, formatCurrency } from '../../lib/masks'

const money = (value = 0) => (Number(value || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function StudentHistoryPage({ token, onLogout, studentId }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingLocation, setSavingLocation] = useState(false)
  const [note, setNote] = useState('')
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [location, setLocation] = useState(null)
  const [showStudentAcademies, setShowStudentAcademies] = useState(false)
  const [form, setForm] = useState({
    titulo: 'Consultoria 2 meses',
    valor: '',
    parcelas: 1,
    metodo_pagamento: 'pix',
    treinos_inclusos: 2,
    avaliacoes_inclusas: 1,
    consultorias_inclusas: 1,
    inicio_em: today(),
  })

  const load = useCallback(async () => {
    try {
      setError('')
      setData(await getStudentHistory(token, studentId))
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [token, studentId])

  useEffect(() => { load() }, [load])

  async function savePlan(event) {
    event.preventDefault()
    const amountInCents = currencyToCents(form.valor)
    if (!amountInCents) return setError('Informe um valor válido para o plano.')

    try {
      setSaving(true)
      setError('')
      await createContract(token, studentId, { ...form, valor_centavos: amountInCents })
      setForm((current) => ({ ...current, valor: '' }))
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

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

  if (!data) return <main className="dashboard-page"><section className="registration-content"><p>Carregando histórico…</p></section></main>

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

        <div className="history-grid">
          <section className="history-card">
            <h2>Novo plano</h2>
            <form onSubmit={savePlan}>
              <label>Plano<input required value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} /></label>
              <div className="form-grid">
                <label>Valor total<input required inputMode="decimal" placeholder="R$ 0,00" value={form.valor} onChange={(event) => setForm({ ...form, valor: formatCurrency(event.target.value) })} /></label>
                <label>Parcelas<select value={form.parcelas} onChange={(event) => setForm({ ...form, parcelas: Number(event.target.value) })}>{[1, 2, 3, 4, 6, 12].map((number) => <option key={number} value={number}>{number}x</option>)}</select></label>
                <label>Pagamento<select value={form.metodo_pagamento} onChange={(event) => setForm({ ...form, metodo_pagamento: event.target.value })}><option value="pix">Pix</option><option value="cartao">Cartão</option><option value="dinheiro">Dinheiro</option></select></label>
                <label>Primeiro vencimento<input type="date" value={form.inicio_em} onChange={(event) => setForm({ ...form, inicio_em: event.target.value })} /></label>
              </div>
              <div className="form-grid">
                <label>Treinos<input type="number" min="0" value={form.treinos_inclusos} onChange={(event) => setForm({ ...form, treinos_inclusos: Number(event.target.value) })} /></label>
                <label>Avaliações<input type="number" min="0" value={form.avaliacoes_inclusas} onChange={(event) => setForm({ ...form, avaliacoes_inclusas: Number(event.target.value) })} /></label>
                <label>Consultorias<input type="number" min="0" value={form.consultorias_inclusas} onChange={(event) => setForm({ ...form, consultorias_inclusas: Number(event.target.value) })} /></label>
              </div>
              <button disabled={saving}>{saving ? 'Salvando…' : 'Salvar plano'}</button>
            </form>
          </section>

          <section className="history-card">
            <h2>Pagamentos</h2>
            {installments.length === 0 && <p>Nenhuma parcela cadastrada.</p>}
            {installments.map((item) => (
              <article className="payment-row" key={item.id}>
                <div>
                  <strong>{item.contract.titulo} · {item.numero}ª parcela</strong>
                  <span>Vence {new Date(`${item.vencimento_em}T12:00`).toLocaleDateString('pt-BR')} · {item.metodo_pagamento}</span>
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
        </div>

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
      </section>
    </main>
  )
}
