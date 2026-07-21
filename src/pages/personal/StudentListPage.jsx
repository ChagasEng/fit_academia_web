import { useEffect, useState } from 'react'
import { getStudent, getStudents, updateStudent } from '../../lib/api'
import BackButton from '../../components/navigation/BackButton'
import StudentDetailsSheet from '../../components/students/StudentDetailsSheet'
import StudentDeactivationModal from '../../components/students/StudentDeactivationModal'
import StudentTypeBadge from '../../components/students/StudentTypeBadge'
import StudentQuickSearch from '../../components/students/StudentQuickSearch'
import AppointmentBookingSheet from './AppointmentBookingSheet'
import RecurringScheduleEditSheet from './RecurringScheduleEditSheet'

export default function StudentListPage({ token, onLogout }) {
  const [students, setStudents] = useState([])
  const [type, setType] = useState('')
  const [status, setStatus] = useState('1')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 })
  const [counts, setCounts] = useState({ total: 0, ativos: 0, inativos: 0, recorrentes: 0, avulsos: 0 })
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusChangingId, setStatusChangingId] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [deactivationTarget, setDeactivationTarget] = useState(null)
  const [deactivationError, setDeactivationError] = useState('')
  const [scheduleTarget, setScheduleTarget] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getStudents(token, page, search, type, status)
      .then((data) => {
        if (!active) return
        setStudents(data.students?.data || [])
        setPagination(data.students || {})
        setCounts(data.counts || {})
      })
      .catch((requestError) => {
        if (!active || requestError.name === 'AbortError') return
        setStudents([])
        setError(requestError.message)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token, page, search, type, status, refresh])

  function selectType(nextType) {
    setType(nextType)
    setPage(1)
  }

  function selectStatus(nextStatus) {
    setStatus(nextStatus)
    setPage(1)
  }

  async function selectStudent(id) {
    try {
      setError('')
      setSelected(await getStudent(token, id))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function toggleStudentStatus(student) {
    const willActivate = !student.ativo
    if (!willActivate) {
      setDeactivationError('')
      setDeactivationTarget(student)
      return
    }
    try {
      setError('')
      setStatusChangingId(student.id)
      const updated = await updateStudent(token, student.id, { ativo: 1 })
      setSelected((current) => current?.id === updated.id ? updated : current)
      setRefresh((value) => value + 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setStatusChangingId(null)
    }
  }

  async function confirmDeactivation(reason) {
    const student = deactivationTarget
    if (!student) return
    try {
      setDeactivationError('')
      setStatusChangingId(student.id)
      const updated = await updateStudent(token, student.id, { ativo: 0, motivo_inativacao: reason })
      setSelected((current) => current?.id === updated.id ? updated : current)
      setDeactivationTarget(null)
      setRefresh((value) => value + 1)
    } catch (requestError) {
      setDeactivationError(requestError.message)
    } finally {
      setStatusChangingId(null)
    }
  }

  function openSchedule(student, recurrence) {
    setSelected(null)
    setScheduleTarget({ student, recurrence })
  }

  async function scheduleSaved() {
    const studentId = scheduleTarget?.student.id
    setScheduleTarget(null)
    setRefresh((value) => value + 1)
    if (!studentId) return
    try {
      setSelected(await getStudent(token, studentId))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="dashboard-page registration-page">
      <header className="dashboard-header">
        <div className="header-side">
          <BackButton fallback="/personal" />
          <strong>fit<span>academia</span></strong>
        </div>
        <div className="header-actions"><StudentQuickSearch token={token} /><button onClick={onLogout}>Sair</button></div>
      </header>

      <section className="registration-content">
        <p className="eyebrow">PERSONAL</p>
        <h1>Alunos cadastrados</h1>
        <p>Organize sua carteira sem perder o histórico de quem não está treinando no momento.</p>

        <div className="student-status-overview" aria-label="Filtrar alunos por situação">
          <button type="button" className={status === '1' ? 'active' : ''} onClick={() => selectStatus('1')}><span className="status-overview-icon active-dot" aria-hidden="true">●</span><span><small>ATIVOS</small><strong>{counts.ativos}</strong><em>Em atendimento</em></span></button>
          <button type="button" className={status === '0' ? 'active' : ''} onClick={() => selectStatus('0')}><span className="status-overview-icon inactive-dot" aria-hidden="true">○</span><span><small>INATIVOS</small><strong>{counts.inativos}</strong><em>Histórico preservado</em></span></button>
          <button type="button" className={status === '' ? 'active' : ''} onClick={() => selectStatus('')}><span className="status-overview-icon" aria-hidden="true">◎</span><span><small>TOTAL</small><strong>{counts.total}</strong><em>Todos os alunos</em></span></button>
        </div>

        <div className="student-list-toolbar">
          <label className="student-list-search"><span aria-hidden="true">⌕</span><input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Buscar por nome" aria-label="Buscar aluno por nome" />{searchInput && <button type="button" onClick={() => setSearchInput('')} aria-label="Limpar busca">×</button>}</label>
          <span>{pagination.total ?? students.length} {status === '1' ? 'ativos' : status === '0' ? 'inativos' : 'alunos'}</span>
        </div>

        <div className="student-filters">
          <button className={!type ? 'active' : ''} onClick={() => selectType('')}>
            Todos os tipos
          </button>
          <button className={type === '5' ? 'active' : ''} onClick={() => selectType('5')}>
            Avulsos <span>{counts.avulsos}</span>
          </button>
          <button className={type === '4' ? 'active' : ''} onClick={() => selectType('4')}>
            Recorrentes <span>{counts.recorrentes}</span>
          </button>
        </div>

        <div className="student-list student-management-list">
          {loading && <p className="list-status">Carregando alunos…</p>}
          {students.map((student) => (
            <article className={student.ativo ? '' : 'inactive'} key={student.id}>
              <button type="button" className="student-row-main" onClick={() => selectStudent(student.id)}>
                <div className="student-avatar">{student.nome.slice(0, 1)}</div>
                <div className="student-row-identity">
                  <div><strong>{student.nome}</strong><span className={`student-status-pill ${student.ativo ? 'active' : 'inactive'}`}>{student.ativo ? 'Ativo' : 'Inativo'}</span></div>
                  <div className="student-row-meta"><StudentTypeBadge type={student.type} /><span>{student.phones?.[0]?.numero || 'Sem telefone'}</span>{student.academy?.nome && <span>{student.academy.nome}</span>}{!student.ativo && student.motivo_inativacao && <span className="student-inactive-reason">Motivo: {student.motivo_inativacao}</span>}</div>
                </div>
                <span className="student-next">›</span>
              </button>
              <button type="button" className={`student-status-toggle ${student.ativo ? 'deactivate' : 'activate'}`} disabled={statusChangingId === student.id} onClick={() => toggleStudentStatus(student)}>{statusChangingId === student.id ? 'Salvando…' : student.ativo ? 'Inativar' : 'Reativar'}</button>
            </article>
          ))}
          {!loading && !error && students.length === 0 && <div className="student-list-empty"><span aria-hidden="true">{search ? '⌕' : status === '0' ? '✓' : '○'}</span><strong>{search ? 'Nenhum aluno com esse nome' : status === '0' ? 'Nenhum aluno inativo' : 'Nenhum aluno ativo'}</strong><small>{search ? 'Tente buscar usando apenas parte do nome.' : status === '0' ? 'Quando alguém for inativado, aparecerá aqui.' : 'Cadastre ou reative um aluno para começar.'}</small></div>}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}

        {pagination.last_page > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button>
            <span>Página {pagination.current_page} de {pagination.last_page}</span>
            <button disabled={page === pagination.last_page} onClick={() => setPage(page + 1)}>Próxima</button>
          </div>
        )}
      </section>

      {selected && <StudentDetailsSheet student={selected} token={token} onClose={() => setSelected(null)} onSchedule={openSchedule} onUpdated={(updated) => {
        setSelected(updated)
        setStudents((items) => items.map((item) => item.id === updated.id ? { ...item, ...updated } : item))
        setRefresh((value) => value + 1)
      }} />}
      {scheduleTarget && !scheduleTarget.recurrence && <AppointmentBookingSheet token={token} day={new Date()} initialStudent={scheduleTarget.student} recurringByDefault dateEditable onClose={() => setScheduleTarget(null)} onSaved={scheduleSaved} />}
      {scheduleTarget?.recurrence && <RecurringScheduleEditSheet token={token} student={scheduleTarget.student} recurrence={scheduleTarget.recurrence} onClose={() => setScheduleTarget(null)} onSaved={scheduleSaved} />}
      {deactivationTarget && <StudentDeactivationModal key={deactivationTarget.id} student={deactivationTarget} saving={statusChangingId === deactivationTarget.id} error={deactivationError} onClose={() => !statusChangingId && setDeactivationTarget(null)} onConfirm={confirmDeactivation} />}
    </main>
  )
}
