import { useState } from 'react'
import { updateAppointmentRecurrence } from '../../lib/api'

const weekdayOptions = [
  [1, 'Seg'], [2, 'Ter'], [3, 'Qua'], [4, 'Qui'], [5, 'Sex'], [6, 'Sáb'], [7, 'Dom'],
]
const todayKey = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function RecurringScheduleEditSheet({ token, student, recurrence, onClose, onSaved }) {
  const [days, setDays] = useState(recurrence.dias_semana || [])
  const [time, setTime] = useState(recurrence.horario || '08:00')
  const [duration, setDuration] = useState(recurrence.duracao_minutos || 60)
  const [endDate, setEndDate] = useState(recurrence.fim_em || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleDay(day) {
    setDays((current) => current.includes(day)
      ? current.filter((item) => item !== day)
      : [...current, day].sort((a, b) => a - b))
  }

  async function submit(event) {
    event.preventDefault()
    if (days.length === 0) return setError('Escolha pelo menos um dia da semana.')
    try {
      setSaving(true)
      setError('')
      await updateAppointmentRecurrence(token, recurrence.grupo, {
        dias_semana: days,
        horario: time,
        duracao_minutos: Number(duration),
        recorrencia_ate: endDate,
      })
      onSaved()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return <section className="booking-sheet recurring-schedule-sheet" role="dialog" aria-modal="true" aria-label="Editar rotina recorrente">
    <div className="day-sheet-header"><div><p className="eyebrow">EDITAR ROTINA</p><h2>{student.nome}</h2></div><button type="button" onClick={onClose} aria-label="Fechar">×</button></div>
    <form onSubmit={submit}>
      <div className="recurring-current-summary"><span>ROTINA ATUAL</span><strong>{recurrence.horario} · {recurrence.quantidade_futura} aulas futuras</strong><small>{recurrence.tipo?.nome || recurrence.titulo} · {recurrence.local}</small></div>
      <fieldset className="appointment-recurrence">
        <legend>Dias da semana</legend>
        <div className="appointment-weekday-grid" aria-label="Dias da semana">
          {weekdayOptions.map(([day, label]) => <label key={day}><input type="checkbox" checked={days.includes(day)} onChange={() => toggleDay(day)} /> {label}</label>)}
        </div>
      </fieldset>
      <div className="recurring-schedule-fields">
        <label>Horário<input required type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
        <label>Duração<select value={duration} onChange={(event) => setDuration(event.target.value)}><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option><option value="120">120 minutos</option></select></label>
        <label>Repetir até<input required type="date" min={todayKey()} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
      </div>
      <p className="recurring-edit-note">A alteração vale somente para aulas futuras. O histórico do aluno permanece igual.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" disabled={saving}>{saving ? 'Atualizando rotina…' : 'Salvar nova rotina'}</button>
    </form>
  </section>
}
