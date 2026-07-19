import { useEffect, useMemo, useState } from 'react'
import { getAppointments } from '../../lib/api'
import BackButton from '../../components/navigation/BackButton'

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const hours = Array.from({ length: 12 }, (_, index) => index + 7)
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const mondayOf = (date) => { const copy = new Date(date); const day = copy.getDay() || 7; copy.setDate(copy.getDate() - day + 1); copy.setHours(0, 0, 0, 0); return copy }
const addDays = (date, days) => { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy }

export default function AgendaPage({ token, onLogout }) {
  const [week, setWeek] = useState(() => mondayOf(new Date()))
  const [appointments, setAppointments] = useState([])
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(week, index)), [week])

  useEffect(() => { getAppointments(token, dateKey(days[0]), dateKey(addDays(days[6], 1))).then(setAppointments).catch(() => setAppointments([])) }, [token, days])
  const today = dateKey(new Date())
  const period = `${days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — ${days[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`

  return <main className="dashboard-page agenda-page"><header className="dashboard-header"><div className="header-side"><BackButton /><strong>fit<span>academia</span></strong></div><button onClick={onLogout}>Sair</button></header><section className="agenda-content"><div className="agenda-toolbar"><div><p className="eyebrow">AGENDA</p><h1>Minha semana</h1></div><div className="agenda-actions"><button onClick={() => setWeek(addDays(week, -7))}>‹</button><button onClick={() => setWeek(mondayOf(new Date()))}>Hoje</button><button onClick={() => setWeek(addDays(week, 7))}>›</button></div></div><p className="agenda-period">{period}</p><div className="calendar"><div className="calendar-corner" />{days.map((day) => <div key={dateKey(day)} className={dateKey(day) === today ? 'calendar-day today' : 'calendar-day'}><span>{weekdays[day.getDay()]}</span><strong>{day.getDate()}</strong></div>)}{hours.map((hour) => <div className="calendar-row" key={hour}><div className="calendar-hour">{String(hour).padStart(2, '0')}:00</div>{days.map((day) => <div className="calendar-cell" key={`${dateKey(day)}-${hour}`}>{appointments.filter((item) => { const start = new Date(item.inicio); return dateKey(start) === dateKey(day) && start.getHours() === hour }).map((item) => <article className="calendar-event" key={item.id}><strong>{item.titulo}</strong><span>{item.student?.nome || 'Atendimento'}</span></article>)}</div>)}</div>)}</div></section></main>
}
