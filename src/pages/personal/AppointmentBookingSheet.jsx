import { useEffect, useState } from 'react'
import AppointmentLocationFields from '../../components/appointments/AppointmentLocationFields'
import { createAppointment, createStudent, getStudents } from '../../lib/api'
import {
  emptyAppointmentLocation,
  locationFromStudentAddress,
  studentAddressFromLocation,
} from '../../lib/appointmentLocation'

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export default function AppointmentBookingSheet({ token, day, onClose, onSaved }) {
  const [mode, setMode] = useState('existing')
  const [students, setStudents] = useState([])
  const [studentId, setStudentId] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [newStudent, setNewStudent] = useState({ nome: '', telefone: '', usuario_tipo_id: '4' })
  const [time, setTime] = useState('08:00')
  const [appointmentType, setAppointmentType] = useState('2')
  const [location, setLocation] = useState(emptyAppointmentLocation)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setStudents([])
      setLoadingStudents(true)
      getStudents(token, 1, studentSearch.trim(), '', controller.signal)
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
  }, [token, studentSearch])

  function changeExistingStudent(id) {
    setStudentId(id)
    const student = students.find((item) => String(item.id) === String(id))
    setSelectedStudent(student || null)
    const address = student?.addresses?.[0]
    if (location.local_tipo === 'domicilio' && address && !location.local_cep) {
      setLocation(locationFromStudentAddress(address))
    }
    if (location.local_tipo === 'academia' && student?.academy && !location.academia_id) {
      setLocation({ ...location, academia_id: student.academy.id, academia_nome: student.academy.nome })
    }
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
    setSaving(true)

    try {
      let selectedId = studentId
      let name = selectedStudent?.nome

      if (mode === 'new') {
        const created = await createStudent(token, {
          nome: newStudent.nome,
          usuario_tipo_id: Number(newStudent.usuario_tipo_id),
          academia_id: location.local_tipo === 'academia' && location.academia_id ? Number(location.academia_id) : null,
          telefone: { numero: newStudent.telefone, tipo: 'whatsapp' },
          endereco: location.local_tipo === 'domicilio' ? studentAddressFromLocation(location) : {},
        })
        selectedId = created.id
        name = created.nome
      }

      if (!selectedId) throw new Error('Escolha um aluno para continuar.')

      const start = new Date(`${dateKey(day)}T${time}:00`)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      const typeName = { 1: 'Avaliação', 2: 'Treino', 3: 'Consultoria' }[appointmentType]

      await createAppointment(token, {
        aluno_id: Number(selectedId),
        agendamento_tipo_id: Number(appointmentType),
        titulo: `${typeName} com ${name}`,
        inicio: start.toISOString(),
        fim: end.toISOString(),
        ...location,
      })
      onSaved()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="booking-sheet" role="dialog" aria-modal="true" aria-label="Novo agendamento">
      <div className="day-sheet-header">
        <div>
          <p className="eyebrow">NOVO AGENDAMENTO</p>
          <h2>{day.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar">×</button>
      </div>

      <form onSubmit={submit}>
        <div className="booking-mode">
          <button type="button" className={mode === 'existing' ? 'active' : ''} onClick={() => setMode('existing')}>Aluno existente</button>
          <button type="button" className={mode === 'new' ? 'active' : ''} onClick={() => setMode('new')}>Cadastrar novo aluno</button>
        </div>

        <label>
          Tipo de agendamento
          <select value={appointmentType} onChange={(event) => setAppointmentType(event.target.value)}>
            <option value="1">Avaliação</option>
            <option value="2">Treino</option>
            <option value="3">Consultoria</option>
          </select>
        </label>

        {mode === 'existing' ? (
          <div className="booking-student-picker">
            <label>
              Pesquisar aluno
              <input type="search" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Digite o nome do aluno" />
              <small>{loadingStudents ? 'Pesquisando…' : 'A lista é atualizada conforme você digita.'}</small>
            </label>
            <label>
              Aluno
              <select required value={studentId} onChange={(event) => changeExistingStudent(event.target.value)}>
                <option value="">Selecione o aluno</option>
                {selectedStudent && !students.some((student) => String(student.id) === String(selectedStudent.id)) && <option value={selectedStudent.id}>{selectedStudent.nome} — {selectedStudent.type?.nome}</option>}
                {students.map((student) => <option key={student.id} value={student.id}>{student.nome} — {student.type?.nome}</option>)}
              </select>
              {!loadingStudents && students.length === 0 && <small>Nenhum aluno encontrado com esse nome.</small>}
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
              <input required inputMode="tel" value={newStudent.telefone} onChange={(event) => setNewStudent({ ...newStudent, telefone: event.target.value })} />
            </label>
            <label>
              Tipo
              <select value={newStudent.usuario_tipo_id} onChange={(event) => setNewStudent({ ...newStudent, usuario_tipo_id: event.target.value })}>
                <option value="4">Aluno recorrente</option>
                <option value="5">Aluno avulso</option>
              </select>
            </label>
          </div>
        )}

        <label>
          Horário
          <input type="time" required value={time} onChange={(event) => setTime(event.target.value)} />
        </label>

        <AppointmentLocationFields token={token} value={location} onChange={changeLocation} />

        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Confirmar agendamento'}</button>
      </form>
    </section>
  )
}
