import { useEffect, useMemo, useState } from 'react'
import { deleteAppointment, getAppointments, getPersonalProfile, getStudent } from '../../lib/api'
import BackButton from '../../components/navigation/BackButton'
import StudentDetailsSheet from '../../components/students/StudentDetailsSheet'
import StudentTypeBadge from '../../components/students/StudentTypeBadge'
import StudentQuickSearch from '../../components/students/StudentQuickSearch'
import AppointmentBookingSheet from './AppointmentBookingSheet'
import AppointmentActionsSheet from './AppointmentActionsSheet'
import AppointmentRescheduleSheet from './AppointmentRescheduleSheet'

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const startOfDay = (date) => { const copy = new Date(date); copy.setHours(0, 0, 0, 0); return copy }
const addDays = (date, days) => { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy }

export default function AgendaPage({ token, onLogout, user }) {
  // A primeira coluna sempre começa na data escolhida (hoje, ao abrir a agenda).
  const [week, setWeek] = useState(() => startOfDay(new Date()))
  const [appointments, setAppointments] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [bookingDay, setBookingDay] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [deletingAppointmentId, setDeletingAppointmentId] = useState(null)
  const [routeMenuAppointmentId, setRouteMenuAppointmentId] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [workingHours, setWorkingHours] = useState({ inicio: '05:00', fim: '20:00' })
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(week, index)), [week])
  const hours = useMemo(() => {
    const [startHour] = workingHours.inicio.split(':').map(Number)
    const [endHour, endMinutes] = workingHours.fim.split(':').map(Number)
    const lastHour = endHour + (endMinutes > 0 ? 1 : 0)
    return Array.from({ length: Math.max(lastHour - startHour, 1) }, (_, index) => startHour + index)
  }, [workingHours])

  useEffect(() => {
    getPersonalProfile(token).then((profile) => setWorkingHours({
      inicio: String(profile.horario_inicio || '05:00').slice(0, 5),
      fim: String(profile.horario_fim || '20:00').slice(0, 5),
    })).catch(() => null)
  }, [token])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getAppointments(token, dateKey(days[0]), dateKey(addDays(days[6], 1)))
      .then((items) => { if (active) setAppointments(Array.isArray(items) ? items : []) })
      .catch((requestError) => {
        if (!active) return
        setAppointments([])
        setError(requestError.message)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token, days, refresh])
  const today = dateKey(new Date())
  const period = `${days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — ${days[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
  const selectedAppointments = selectedDay ? appointments.filter((item) => dateKey(new Date(item.inicio)) === dateKey(selectedDay)) : []

  async function openStudent(studentId) {
    if (!studentId) return
    try {
      setError('')
      setSelectedDay(null)
      setSelectedStudent(await getStudent(token, studentId))
    } catch (requestError) {
      setError(requestError.message)
    }
  }
  function selectCalendarCell(event, day) {
    if (event.target !== event.currentTarget) return
    if (event.type === 'click' || event.key === 'Enter' || event.key === ' ') {
      if (event.type !== 'click') event.preventDefault()
      setSelectedDay(day)
    }
  }
  function openTodaySummary() {
    const currentDay = startOfDay(new Date())
    const isInVisibleWeek = currentDay >= days[0] && currentDay <= days[6]
    if (!isInVisibleWeek) setWeek(currentDay)
    setSelectedDay(currentDay)
  }

  function handleRescheduled(updated) {
    const newDay = startOfDay(new Date(updated.inicio))
    setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item))
    setEditingAppointment(null)
    setWeek(newDay)
    setSelectedDay(newDay)
    setRefresh((value) => value + 1)
  }

  async function handleDelete(appointment) {
    const schedule = new Date(appointment.inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    if (!window.confirm(`Excluir o agendamento de ${appointment.student?.nome || 'este aluno'} em ${schedule}? Esta ação não pode ser desfeita.`)) return false
    setError('')
    setDeletingAppointmentId(appointment.id)
    try {
      await deleteAppointment(token, appointment.id)
      setAppointments((current) => current.filter((item) => item.id !== appointment.id))
      setRouteMenuAppointmentId(null)
      return true
    } catch (requestError) {
      setError(requestError.message)
      return false
    } finally {
      setDeletingAppointmentId(null)
    }
  }

  function routeDestination(appointment) {
    if (appointment.local_tipo === 'academia') {
      return appointment.academy?.endereco || [appointment.academia_nome || appointment.academy?.nome, appointment.academy?.cidade, appointment.academy?.estado].filter(Boolean).join(', ')
    }

    return [appointment.local_rua, appointment.local_numero, appointment.local_bairro, appointment.local_cidade, appointment.local_estado, appointment.local_cep].filter(Boolean).join(', ')
  }

  function openRoute(appointment, provider) {
    const destination = routeDestination(appointment)
    if (!destination) return
    const query = encodeURIComponent(destination)
    const url = provider === 'waze' ? `https://www.waze.com/ul?q=${query}&navigate=yes` : `https://www.google.com/maps/dir/?api=1&destination=${query}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setRouteMenuAppointmentId(null)
  }
  function eventCards(day, hour) { return appointments.filter((item) => { const start = new Date(item.inicio); return dateKey(start) === dateKey(day) && start.getHours() === hour }).map((item) => <button className="calendar-event" key={item.id} aria-label={`Gerenciar ${item.titulo}`} onClick={(event) => { event.stopPropagation(); setSelectedAppointment(item) }}><span className="calendar-event-top"><time>{new Date(item.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time><b aria-hidden="true">•••</b></span><strong>{item.titulo}</strong><span>{item.student?.nome || 'Atendimento'}</span><StudentTypeBadge type={item.student?.type} /></button>) }

  return (
    <main className="dashboard-page agenda-page">
      <header className="dashboard-header">
        <div className="header-side"><BackButton /><strong>fit<span>academia</span></strong></div>
        <div className="header-actions"><StudentQuickSearch token={token} /><button onClick={onLogout}>Sair</button></div>
      </header>
      <section className="agenda-content">
        <div className="agenda-toolbar">
          <div><p className="eyebrow">AGENDA</p><div className="agenda-title-row"><h1>Minha semana</h1><button type="button" className="today-summary-button" onClick={openTodaySummary}>Resumo do dia</button></div></div>
          <div className="agenda-actions">
            <label className="agenda-date-picker"><span>Ir para data</span><input type="date" value={dateKey(week)} onChange={(event) => event.target.value && setWeek(startOfDay(new Date(`${event.target.value}T00:00:00`)))} /></label>
            <button aria-label="Semana anterior" onClick={() => setWeek(addDays(week, -7))}>‹</button>
            <button onClick={() => setWeek(startOfDay(new Date()))}>Hoje</button>
            <button aria-label="Próxima semana" onClick={() => setWeek(addDays(week, 7))}>›</button>
          </div>
        </div>
        <div className="agenda-period-row"><p className="agenda-period">{period}</p><button type="button" onClick={() => { window.history.pushState({}, '', '/personal/perfil'); window.dispatchEvent(new PopStateEvent('popstate')) }}><span aria-hidden="true">◷</span> Expediente {workingHours.inicio}–{workingHours.fim}<small>Editar no perfil</small></button></div>
        {loading && <p className="loading-status">Carregando agenda…</p>}
        {error && <div className="map-warning"><span>{error}</span><button type="button" onClick={() => setRefresh((value) => value + 1)}>Tentar novamente</button></div>}
        <div className="calendar" aria-busy={loading}>
          <div className="calendar-corner" />
          {days.map((day) => <button key={dateKey(day)} onClick={() => setSelectedDay(day)} className={dateKey(day) === today ? 'calendar-day today' : 'calendar-day'}><span>{weekdays[day.getDay()]}</span><strong>{day.getDate()}</strong></button>)}
          {hours.map((hour) => <div className="calendar-row" key={hour}><div className="calendar-hour">{String(hour).padStart(2, '0')}:00</div>{days.map((day) => <div role="button" tabIndex="0" onClick={(event) => selectCalendarCell(event, day)} onKeyDown={(event) => selectCalendarCell(event, day)} className={dateKey(day) === today ? 'calendar-cell today-cell' : 'calendar-cell'} key={`${dateKey(day)}-${hour}`}>{eventCards(day, hour)}</div>)}</div>)}
        </div>
      </section>
      {selectedDay && <section className="day-sheet" role="dialog" aria-modal="true" aria-label="Agendamentos do dia"><div className="day-sheet-header"><div><p className="eyebrow">AGENDA DO DIA</p><h2>{selectedDay.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</h2></div><button onClick={() => setSelectedDay(null)} aria-label="Fechar lista">×</button></div><button className="new-appointment" onClick={() => setBookingDay(selectedDay)}>+ Novo agendamento</button><div className="day-appointments">{selectedAppointments.map((item) => {
        const destination = routeDestination(item)
        const isRouteMenuOpen = routeMenuAppointmentId === item.id
        return <article key={item.id}>
          <button type="button" className="day-appointment-details" onClick={() => openStudent(item.student?.id)}><time>{new Date(item.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time><div><strong>{item.titulo}</strong><span>{item.student?.nome || 'Atendimento'}</span></div></button>
          <div className="day-appointment-actions">
            <button type="button" className="appointment-reschedule" onClick={() => setEditingAppointment(item)}>Reagendar</button>
            {destination && <div className="day-route-actions"><button type="button" className="day-route-trigger" onClick={() => setRouteMenuAppointmentId(isRouteMenuOpen ? null : item.id)}>IR</button>{isRouteMenuOpen && <span><button type="button" onClick={() => openRoute(item, 'maps')}>Maps</button><button type="button" onClick={() => openRoute(item, 'waze')}>Waze</button></span>}</div>}
            <button type="button" className="appointment-delete" disabled={deletingAppointmentId === item.id} onClick={() => handleDelete(item)}>{deletingAppointmentId === item.id ? 'Excluindo…' : 'Excluir'}</button>
          </div>
        </article>
      })}{selectedAppointments.length === 0 && <p>Nenhum aluno agendado neste dia.</p>}</div></section>}
      {bookingDay && <AppointmentBookingSheet token={token} day={bookingDay} personalName={user?.name} onClose={() => setBookingDay(null)} onSaved={() => { setBookingDay(null); setSelectedDay(null); setRefresh((value) => value + 1) }} />}
      {selectedAppointment && <AppointmentActionsSheet
        appointment={selectedAppointment}
        hasRoute={Boolean(routeDestination(selectedAppointment))}
        deleting={deletingAppointmentId === selectedAppointment.id}
        onClose={() => setSelectedAppointment(null)}
        onReschedule={() => { setEditingAppointment(selectedAppointment); setSelectedAppointment(null) }}
        onViewStudent={() => { const studentId = selectedAppointment.student?.id; setSelectedAppointment(null); openStudent(studentId) }}
        onOpenRoute={(provider) => openRoute(selectedAppointment, provider)}
        onDelete={async () => { if (await handleDelete(selectedAppointment)) setSelectedAppointment(null) }}
      />}
      {editingAppointment && <AppointmentRescheduleSheet key={editingAppointment.id} token={token} appointment={editingAppointment} onClose={() => setEditingAppointment(null)} onSaved={handleRescheduled} />}
      {selectedStudent && <StudentDetailsSheet student={selectedStudent} token={token} onClose={() => setSelectedStudent(null)} onUpdated={(updated) => setSelectedStudent(updated)} />}
    </main>
  )
}
