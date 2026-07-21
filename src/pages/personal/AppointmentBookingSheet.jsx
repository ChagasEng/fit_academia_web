import { useEffect, useState } from 'react'
import AppointmentLocationFields from '../../components/appointments/AppointmentLocationFields'
import AvailableTimeSlots from '../../components/appointments/AvailableTimeSlots'
import { createAppointment, createStudent, getAvailableAppointmentTimes, getStudents } from '../../lib/api'
import {
  emptyAppointmentLocation,
  locationFromStudentAddress,
  studentAddressFromLocation,
} from '../../lib/appointmentLocation'
import { formatPhone, phoneDigits } from '../../lib/masks'

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const weekdays = [
  [1, 'Seg'], [2, 'Ter'], [3, 'Qua'], [4, 'Qui'], [5, 'Sex'], [6, 'Sáb'], [7, 'Dom'],
]

function firstRecurringDay(startDay, selectedWeekdays) {
  const date = new Date(startDay)
  date.setHours(0, 0, 0, 0)
  for (let offset = 0; offset < 7; offset += 1) {
    const weekday = date.getDay() === 0 ? 7 : date.getDay()
    if (selectedWeekdays.includes(weekday)) return date
    date.setDate(date.getDate() + 1)
  }
  return new Date(startDay)
}

function locationForStudent(student) {
  if (student?.academy) return { ...emptyAppointmentLocation, local_tipo: 'academia', academia_id: student.academy.id, academia_nome: student.academy.nome }
  if (student?.addresses?.[0]) return locationFromStudentAddress(student.addresses[0])
  return { ...emptyAppointmentLocation }
}

export default function AppointmentBookingSheet({ token, day = new Date(), onClose, onSaved, initialStudent = null, recurringByDefault = false, dateEditable = false }) {
  const [bookingDay, setBookingDay] = useState(day)
  const [mode, setMode] = useState('existing')
  const [students, setStudents] = useState(initialStudent ? [initialStudent] : [])
  const [studentId, setStudentId] = useState(initialStudent ? String(initialStudent.id) : '')
  const [selectedStudent, setSelectedStudent] = useState(initialStudent)
  const [studentSearch, setStudentSearch] = useState(initialStudent?.nome || '')
  const [studentPickerOpen, setStudentPickerOpen] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [newStudent, setNewStudent] = useState({ nome: '', telefone: '', usuario_tipo_id: '4' })
  const [time, setTime] = useState('08:00')
  const [availableTimes, setAvailableTimes] = useState([])
  const [workingHours, setWorkingHours] = useState(null)
  const [loadingTimes, setLoadingTimes] = useState(true)
  const [appointmentType, setAppointmentType] = useState('2')
  const [location, setLocation] = useState(() => locationForStudent(initialStudent))
  const [repeatEveryDay, setRepeatEveryDay] = useState(recurringByDefault)
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState([1, 2, 3, 4, 5])
  const [recurrenceEnd, setRecurrenceEnd] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const availabilityDay = repeatEveryDay && recurrenceWeekdays.length > 0
    ? firstRecurringDay(bookingDay, recurrenceWeekdays)
    : bookingDay
  const availabilityDate = dateKey(availabilityDay)

  useEffect(() => {
    if (initialStudent) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setStudents([])
      setLoadingStudents(true)
      getStudents(token, 1, studentSearch.trim(), '', '1', controller.signal)
        .then((data) => setStudents(data.students?.data || []))
        .catch((requestError) => {
          if (requestError.name !== 'AbortError') setError(requestError.message)
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoadingStudents(false)
        })
    }, studentSearch.trim() ? 220 : 0)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [token, studentSearch, initialStudent])

  useEffect(() => {
    const controller = new AbortController()
    setLoadingTimes(true)
    getAvailableAppointmentTimes(token, {
      date: availabilityDate,
      durationMinutes: 60,
      beforeMinutes: location.deslocamento_antes_minutos ?? (location.local_tipo === 'domicilio' ? 30 : 0),
      afterMinutes: location.deslocamento_depois_minutos ?? (location.local_tipo === 'domicilio' ? 30 : 0),
    }, controller.signal)
      .then((response) => {
        const slots = response.horarios || []
        setAvailableTimes(slots)
        setWorkingHours({ inicio: response.horario_inicio, fim: response.horario_fim })
        setTime((current) => slots.some((slot) => slot.inicio === current) ? current : (slots[0]?.inicio || ''))
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setAvailableTimes([])
          setError(requestError.message)
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingTimes(false) })
    return () => controller.abort()
  }, [token, availabilityDate, location.local_tipo, location.deslocamento_antes_minutos, location.deslocamento_depois_minutos])

  function changeExistingStudent(id) {
    setStudentId(id)
    const student = students.find((item) => String(item.id) === String(id))
    setSelectedStudent(student || null)
    if (student && student.usuario_tipo_id !== 4 && student.type?.slug !== 'aluno_recorrente') setRepeatEveryDay(false)
    const address = student?.addresses?.[0]
    if (location.local_tipo === 'domicilio' && address && !location.local_cep) {
      setLocation(locationFromStudentAddress(address))
    }
    if (location.local_tipo === 'academia' && student?.academy && !location.academia_id) {
      setLocation({ ...location, academia_id: student.academy.id, academia_nome: student.academy.nome })
    }
  }

  function selectExistingStudent(student) {
    changeExistingStudent(student.id)
    setStudentSearch(student.nome || '')
    setStudentPickerOpen(false)
  }

  function changeLocation(nextLocation) {
    const switchedToHome = location.local_tipo !== 'domicilio' && nextLocation.local_tipo === 'domicilio'
    const switchedToAcademy = location.local_tipo !== 'academia' && nextLocation.local_tipo === 'academia'
    const student = selectedStudent
    const address = student?.addresses?.[0]
    if (switchedToHome && address) return setLocation(locationFromStudentAddress(address))
    if (switchedToAcademy && student?.academy) return setLocation({ ...nextLocation, academia_id: student.academy.id, academia_nome: student.academy.nome })
    setLocation(nextLocation)
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!time) return setError('Escolha um dia com horário disponível.')
    if (repeatEveryDay && recurrenceWeekdays.length === 0) return setError('Escolha pelo menos um dia para repetir o horário.')
    const phone = phoneDigits(newStudent.telefone)
    setSaving(true)

    try {
      let selectedId = studentId
      let name = selectedStudent?.nome

      if (mode === 'new') {
        const created = await createStudent(token, {
          nome: newStudent.nome,
          usuario_tipo_id: Number(newStudent.usuario_tipo_id),
          academia_id: location.local_tipo === 'academia' && location.academia_id ? Number(location.academia_id) : null,
          telefone: { numero: phone, tipo: 'whatsapp' },
          endereco: location.local_tipo === 'domicilio' ? studentAddressFromLocation(location) : {},
        })
        selectedId = created.id
        name = created.nome
      }

      if (!selectedId) throw new Error('Escolha um aluno para continuar.')

      const start = new Date(`${dateKey(bookingDay)}T${time}:00`)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      const typeName = { 1: 'Avaliação', 2: 'Treino', 3: 'Consultoria' }[appointmentType]
      const recurringStudent = mode === 'new'
        ? Number(newStudent.usuario_tipo_id) === 4
        : selectedStudent?.usuario_tipo_id === 4 || selectedStudent?.type?.slug === 'aluno_recorrente'

      await createAppointment(token, {
        aluno_id: Number(selectedId),
        agendamento_tipo_id: Number(appointmentType),
        titulo: `${typeName} com ${name}`,
        inicio: start.toISOString(),
        fim: end.toISOString(),
        ...location,
        ...(repeatEveryDay && recurringStudent ? {
          recorrencia_todos_dias: true,
          recorrencia_dias_semana: recurrenceWeekdays,
          ...(recurrenceEnd ? { recorrencia_ate: recurrenceEnd } : {}),
        } : {}),
      })
      onSaved()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const recurringStudent = mode === 'new'
    ? Number(newStudent.usuario_tipo_id) === 4
    : selectedStudent?.usuario_tipo_id === 4 || selectedStudent?.type?.slug === 'aluno_recorrente'

  function toggleWeekday(weekday) {
    setRecurrenceWeekdays((current) => current.includes(weekday)
      ? current.filter((item) => item !== weekday)
      : [...current, weekday].sort((a, b) => a - b))
  }

  return (
    <section className="booking-sheet" role="dialog" aria-modal="true" aria-label="Novo agendamento">
      <div className="day-sheet-header">
        <div>
          <p className="eyebrow">NOVO AGENDAMENTO</p>
          <h2>{initialStudent ? initialStudent.nome : bookingDay.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar">×</button>
      </div>

      <form onSubmit={submit}>
        {!initialStudent && <div className="booking-mode">
          <button type="button" className={mode === 'existing' ? 'active' : ''} onClick={() => setMode('existing')}>Aluno existente</button>
          <button type="button" className={mode === 'new' ? 'active' : ''} onClick={() => setMode('new')}>Cadastrar novo aluno</button>
        </div>}

        {dateEditable && <label>Começar em<input type="date" min={dateKey(new Date())} value={dateKey(bookingDay)} onChange={(event) => event.target.value && setBookingDay(new Date(`${event.target.value}T00:00:00`))} /></label>}

        <label>
          Tipo de agendamento
          <select value={appointmentType} onChange={(event) => setAppointmentType(event.target.value)}>
            <option value="1">Avaliação</option>
            <option value="2">Treino</option>
            <option value="3">Consultoria</option>
          </select>
        </label>

        {initialStudent ? <div className="booking-locked-student"><span>ALUNO RECORRENTE</span><strong>{initialStudent.nome}</strong><small>O horário será vinculado diretamente a este aluno.</small></div> : mode === 'existing' ? (
          <div className="booking-student-picker">
            <label>
              Aluno
              <input
                type="search"
                role="combobox"
                aria-expanded={studentPickerOpen}
                aria-controls="appointment-student-options"
                value={studentSearch}
                onFocus={() => setStudentPickerOpen(true)}
                onChange={(event) => {
                  setStudentSearch(event.target.value)
                  setStudentId('')
                  setSelectedStudent(null)
                  setStudentPickerOpen(true)
                }}
                placeholder="Pesquise e selecione o aluno"
              />
              <input type="hidden" required value={studentId} onChange={() => {}} />
              {studentPickerOpen && <div id="appointment-student-options" className="booking-student-options" role="listbox">
                {students.map((student) => <button type="button" role="option" aria-selected={String(student.id) === String(studentId)} key={student.id} onMouseDown={(event) => event.preventDefault()} onClick={() => selectExistingStudent(student)}><strong>{student.nome}</strong><span>{student.type?.nome || 'Tipo não informado'}</span></button>)}
                {loadingStudents && <small>Pesquisando…</small>}
                {!loadingStudents && students.length === 0 && <small>Nenhum aluno encontrado com esse nome.</small>}
              </div>}
            </label>
          </div>
        ) : (
          <div className="booking-grid">
            <label>
              Nome
              <input required value={newStudent.nome} onChange={(event) => setNewStudent({ ...newStudent, nome: event.target.value })} />
            </label>
            <label>
              WhatsApp
              <input required type="tel" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={formatPhone(newStudent.telefone)} onChange={(event) => setNewStudent({ ...newStudent, telefone: phoneDigits(event.target.value) })} />
            </label>
            <label>
              Tipo
              <select value={newStudent.usuario_tipo_id} onChange={(event) => {
                if (event.target.value !== '4') setRepeatEveryDay(false)
                setNewStudent({ ...newStudent, usuario_tipo_id: event.target.value })
              }}>
                <option value="4">Aluno recorrente</option>
                <option value="5">Aluno avulso</option>
              </select>
            </label>
          </div>
        )}

        {recurringStudent && <fieldset className="appointment-recurrence">
          <legend>Repetir horário</legend>
          <label className="appointment-recurrence-toggle">
            <input type="checkbox" checked={repeatEveryDay} onChange={(event) => setRepeatEveryDay(event.target.checked)} />
            <span><strong>Repetir nos dias da semana</strong><small>As aulas só serão criadas a partir da data escolhida.</small></span>
          </label>
          {repeatEveryDay && <div className="appointment-recurrence-options">
            <div className="appointment-weekday-grid" aria-label="Dias da semana">
              {weekdays.map(([weekday, label]) => <label key={weekday}><input type="checkbox" checked={recurrenceWeekdays.includes(weekday)} onChange={() => toggleWeekday(weekday)} /> {label}</label>)}
            </div>
            <label className="appointment-recurrence-end">Repetir até <input type="date" min={dateKey(bookingDay)} value={recurrenceEnd} onChange={(event) => setRecurrenceEnd(event.target.value)} /></label>
            <small>Escolha pelo menos um dia. Sem data final, serão criados os próximos 3 meses.</small>
          </div>}
        </fieldset>}

        <AppointmentLocationFields token={token} value={location} onChange={changeLocation} />

        <AvailableTimeSlots slots={availableTimes} value={time} onChange={setTime} loading={loadingTimes} workingHours={workingHours} dateLabel={availabilityDay.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} />

        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={saving || loadingTimes || !time}>{saving ? 'Salvando…' : 'Confirmar agendamento'}</button>
      </form>
    </section>
  )
}
