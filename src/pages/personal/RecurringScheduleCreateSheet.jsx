import { useState } from 'react'
import AppointmentLocationFields from '../../components/appointments/AppointmentLocationFields'
import { createStudentRecurrences } from '../../lib/api'
import { emptyAppointmentLocation, locationFromStudentAddress } from '../../lib/appointmentLocation'

const weekdayOptions = [
  [1, 'Seg'], [2, 'Ter'], [3, 'Qua'], [4, 'Qui'], [5, 'Sex'], [6, 'Sáb'], [7, 'Dom'],
]
let nextRuleId = 1

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

function defaultEndDate() {
  const date = new Date()
  date.setMonth(date.getMonth() + 3)
  return dateKey(date)
}

function locationForStudent(student) {
  if (student?.academy) return { ...emptyAppointmentLocation, local_tipo: 'academia', academia_id: student.academy.id, academia_nome: student.academy.nome }
  if (student?.addresses?.[0]) return locationFromStudentAddress(student.addresses[0])
  return { ...emptyAppointmentLocation }
}

function newRule(days = [], time = '08:00') {
  nextRuleId += 1
  return { id: nextRuleId, days, time }
}

export default function RecurringScheduleCreateSheet({ token, student, personalName = 'Personal', onClose, onSaved }) {
  const [startDate, setStartDate] = useState(dateKey(new Date()))
  const [endDate, setEndDate] = useState(defaultEndDate)
  const [appointmentType, setAppointmentType] = useState('2')
  const [duration, setDuration] = useState('60')
  const [rules, setRules] = useState(() => [newRule([1, 2, 3, 4, 5])])
  const [location, setLocation] = useState(() => locationForStudent(student))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleDay(ruleId, day) {
    setRules((current) => current.map((rule) => rule.id !== ruleId ? rule : {
      ...rule,
      days: rule.days.includes(day)
        ? rule.days.filter((item) => item !== day)
        : [...rule.days, day].sort((a, b) => a - b),
    }))
  }

  function updateTime(ruleId, time) {
    setRules((current) => current.map((rule) => rule.id === ruleId ? { ...rule, time } : rule))
  }

  function removeRule(ruleId) {
    setRules((current) => current.filter((rule) => rule.id !== ruleId))
  }

  async function submit(event) {
    event.preventDefault()
    if (rules.some((rule) => rule.days.length === 0)) return setError('Escolha pelo menos um dia em cada horário.')
    try {
      setSaving(true)
      setError('')
      const typeName = { 1: 'Avaliação', 2: 'Treino', 3: 'Consultoria' }[appointmentType]
      await createStudentRecurrences(token, student.id, {
        agendamento_tipo_id: Number(appointmentType),
        titulo: `${typeName} com ${personalName}`,
        inicio_em: startDate,
        recorrencia_ate: endDate,
        duracao_minutos: Number(duration),
        horarios: rules.map((rule) => ({ dias_semana: rule.days, horario: rule.time })),
        ...location,
      })
      onSaved()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return <section className="booking-sheet recurring-multi-sheet" role="dialog" aria-modal="true" aria-label="Definir rotina semanal">
    <div className="day-sheet-header"><div><p className="eyebrow">ROTINA SEMANAL</p><h2>{student.nome}</h2></div><button type="button" onClick={onClose} aria-label="Fechar">×</button></div>
    <form onSubmit={submit}>
      <div className="recurring-schedule-fields">
        <label>Começar em<input required type="date" min={dateKey(new Date())} value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label>Repetir até<input required type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
        <label>Tipo<select value={appointmentType} onChange={(event) => setAppointmentType(event.target.value)}><option value="1">Avaliação</option><option value="2">Treino</option><option value="3">Consultoria</option></select></label>
        <label>Duração<select value={duration} onChange={(event) => setDuration(event.target.value)}><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option><option value="120">120 minutos</option></select></label>
      </div>

      <section className="multi-schedule-rules">
        <header><div><span>DIAS E HORÁRIOS</span><strong>Monte a semana completa</strong></div><button type="button" onClick={() => setRules((current) => [...current, newRule()])}>+ Outro horário</button></header>
        {rules.map((rule, index) => <article key={rule.id}>
          <div className="multi-schedule-rule-heading"><strong>Horário {index + 1}</strong>{rules.length > 1 && <button type="button" onClick={() => removeRule(rule.id)}>Remover</button>}</div>
          <div className="appointment-weekday-grid" aria-label={`Dias do horário ${index + 1}`}>
            {weekdayOptions.map(([day, label]) => <label key={day}><input type="checkbox" checked={rule.days.includes(day)} onChange={() => toggleDay(rule.id, day)} /> {label}</label>)}
          </div>
          <label className="multi-schedule-time">Horário<input required type="time" value={rule.time} onChange={(event) => updateTime(rule.id, event.target.value)} /></label>
        </article>)}
        <p>Exemplo: marque Seg e Qua às 17:00; depois adicione outro horário e marque Sex às 13:00.</p>
      </section>

      <AppointmentLocationFields token={token} value={location} onChange={setLocation} />
      <p className="recurring-edit-note">Antes de salvar, verificamos todas as datas. Se houver conflito, nenhuma aula da nova rotina será criada.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" disabled={saving}>{saving ? 'Verificando e salvando…' : 'Salvar rotina completa'}</button>
    </form>
  </section>
}
