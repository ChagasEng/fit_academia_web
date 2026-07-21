import { useEffect, useMemo, useState } from 'react'
import AvailableTimeSlots from '../../components/appointments/AvailableTimeSlots'
import { getAvailableAppointmentTimes, updateAppointment } from '../../lib/api'

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const timeKey = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

export default function AppointmentRescheduleSheet({ token, appointment, onClose, onSaved }) {
  const originalStart = new Date(appointment.inicio)
  const originalEnd = new Date(appointment.fim)
  const durationMinutes = useMemo(() => Math.max(15, Math.round((originalEnd - originalStart) / 60000)), [appointment.id])
  const [date, setDate] = useState(dateKey(originalStart))
  const [startTime, setStartTime] = useState(timeKey(originalStart))
  const [availableTimes, setAvailableTimes] = useState([])
  const [workingHours, setWorkingHours] = useState(null)
  const [loadingTimes, setLoadingTimes] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoadingTimes(true)
    setError('')
    getAvailableAppointmentTimes(token, {
      date,
      durationMinutes,
      ignoreAppointmentId: appointment.id,
      beforeMinutes: appointment.deslocamento_antes_minutos,
      afterMinutes: appointment.deslocamento_depois_minutos,
    }, controller.signal)
      .then((response) => {
        const slots = response.horarios || []
        setAvailableTimes(slots)
        setWorkingHours({ inicio: response.horario_inicio, fim: response.horario_fim })
        setStartTime((current) => slots.some((slot) => slot.inicio === current) ? current : (slots[0]?.inicio || ''))
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setAvailableTimes([])
          setError(requestError.message)
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingTimes(false) })
    return () => controller.abort()
  }, [token, appointment.id, appointment.deslocamento_antes_minutos, appointment.deslocamento_depois_minutos, date, durationMinutes])

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!startTime) return setError('Escolha um horário disponível para continuar.')
    const start = new Date(`${date}T${startTime}:00`)
    const end = new Date(start.getTime() + durationMinutes * 60000)

    setSaving(true)
    try {
      onSaved(await updateAppointment(token, appointment.id, {
        inicio: start.toISOString(),
        fim: end.toISOString(),
      }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return <div className="appointment-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="booking-sheet reschedule-sheet" role="dialog" aria-modal="true" aria-labelledby="reschedule-title">
    <div className="sheet-handle" aria-hidden="true" />
    <div className="day-sheet-header">
      <div><p className="eyebrow">REAGENDAR ALUNO</p><h2 id="reschedule-title">{appointment.student?.nome || appointment.titulo}</h2></div>
      <button type="button" onClick={onClose} aria-label="Fechar reagendamento">×</button>
    </div>
    <div className="reschedule-current"><span>Agendamento atual</span><strong>{originalStart.toLocaleDateString('pt-BR')} · {timeKey(originalStart)}–{timeKey(originalEnd)}</strong><small>{appointment.type?.nome || appointment.titulo}</small></div>
    <form onSubmit={submit}>
      <label>Nova data<input type="date" required min={dateKey(new Date())} value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <AvailableTimeSlots slots={availableTimes} value={startTime} onChange={setStartTime} loading={loadingTimes} workingHours={workingHours} durationMinutes={durationMinutes} />
      <p className="reschedule-note">O aluno, o tipo e o local do atendimento serão mantidos.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" disabled={saving || loadingTimes || !startTime}>{saving ? 'Reagendando…' : 'Confirmar novo horário'}</button>
    </form>
  </section></div>
}
