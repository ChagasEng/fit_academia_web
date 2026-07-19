import { useEffect, useMemo, useState } from 'react'
import { getAppointments, getStudent } from '../../lib/api'
import BackButton from '../../components/navigation/BackButton'
import StudentDetailsSheet from '../../components/students/StudentDetailsSheet'
import AppointmentBookingSheet from './AppointmentBookingSheet'

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const hours = Array.from({ length: 12 }, (_, index) => index + 7)
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const mondayOf = (date) => { const copy = new Date(date); const day = copy.getDay() || 7; copy.setDate(copy.getDate() - day + 1); copy.setHours(0, 0, 0, 0); return copy }
const addDays = (date, days) => { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy }

export default function AgendaPage({ token, onLogout }) {
  const [week, setWeek] = useState(() => mondayOf(new Date()))
  const [appointments, setAppointments] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [bookingDay, setBookingDay] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(week, index)), [week])

  useEffect(() => { getAppointments(token, dateKey(days[0]), dateKey(addDays(days[6], 1))).then(setAppointments).catch(() => setAppointments([])) }, [token, days, refresh])
  const today = dateKey(new Date())
  const period = `${days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — ${days[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
  const selectedAppointments = selectedDay ? appointments.filter((item) => dateKey(new Date(item.inicio)) === dateKey(selectedDay)) : []

  async function openStudent(studentId) { if (studentId) { setSelectedDay(null); setSelectedStudent(await getStudent(token, studentId)) } }
  function eventCards(day, hour) { return appointments.filter((item) => { const start = new Date(item.inicio); return dateKey(start) === dateKey(day) && start.getHours() === hour }).map((item) => <button className="calendar-event" key={item.id} onClick={(event) => { event.stopPropagation(); openStudent(item.student?.id) }}><strong>{item.titulo}</strong><span>{item.student?.nome || 'Atendimento'}</span></button>) }

  return <main className="dashboard-page agenda-page"><header className="dashboard-header"><div className="header-side"><BackButton /><strong>fit<span>academia</span></strong></div><button onClick={onLogout}>Sair</button></header><section className="agenda-content"><div className="agenda-toolbar"><div><p className="eyebrow">AGENDA</p><h1>Minha semana</h1></div><div className="agenda-actions"><button onClick={() => setWeek(addDays(week, -7))}>‹</button><button onClick={() => setWeek(mondayOf(new Date()))}>Hoje</button><button onClick={() => setWeek(addDays(week, 7))}>›</button></div></div><p className="agenda-period">{period}</p><div className="calendar"><div className="calendar-corner" />{days.map((day) => <button key={dateKey(day)} onClick={() => setSelectedDay(day)} className={dateKey(day) === today ? 'calendar-day today' : 'calendar-day'}><span>{weekdays[day.getDay()]}</span><strong>{day.getDate()}</strong></button>)}{hours.map((hour) => <div className="calendar-row" key={hour}><div className="calendar-hour">{String(hour).padStart(2, '0')}:00</div>{days.map((day) => <div role="button" tabIndex="0" onClick={() => setSelectedDay(day)} className="calendar-cell" key={`${dateKey(day)}-${hour}`}>{eventCards(day, hour)}</div>)}</div>)}</div></section>{selectedDay && <section className="day-sheet" role="dialog" aria-modal="true" aria-label="Agendamentos do dia"><div className="day-sheet-header"><div><p className="eyebrow">AGENDA DO DIA</p><h2>{selectedDay.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</h2></div><button onClick={() => setSelectedDay(null)} aria-label="Fechar lista">×</button></div><button className="new-appointment" onClick={() => setBookingDay(selectedDay)}>+ Novo agendamento</button><div className="day-appointments">{selectedAppointments.map((item) => <button key={item.id} onClick={() => openStudent(item.student?.id)}><time>{new Date(item.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time><div><strong>{item.titulo}</strong><span>{item.student?.nome || 'Atendimento'}</span></div></button>)}{selectedAppointments.length === 0 && <p>Nenhum agendamento para este dia.</p>}</div></section>}{bookingDay && <AppointmentBookingSheet token={token} day={bookingDay} onClose={() => setBookingDay(null)} onSaved={() => { setBookingDay(null); setSelectedDay(null); setRefresh((value) => value + 1) }} />}{selectedStudent && <StudentDetailsSheet student={selectedStudent} onClose={() => setSelectedStudent(null)} />}</main>
}
