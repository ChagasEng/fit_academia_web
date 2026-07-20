import { useEffect, useState } from 'react'
import { getStudent, getStudents } from '../../lib/api'
import BackButton from '../../components/navigation/BackButton'
import StudentDetailsSheet from '../../components/students/StudentDetailsSheet'
import StudentTypeBadge from '../../components/students/StudentTypeBadge'
import StudentQuickSearch from '../../components/students/StudentQuickSearch'

export default function StudentListPage({ token, onLogout }) {
  const [students, setStudents] = useState([])
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 })
  const [counts, setCounts] = useState({ total: 0, recorrentes: 0, avulsos: 0 })
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getStudents(token, page, '', type)
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
  }, [token, page, type])

  function selectType(nextType) {
    setType(nextType)
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
        <p>Todos os alunos vinculados ao seu atendimento.</p>

        <div className="student-filters">
          <button className={!type ? 'active' : ''} onClick={() => selectType('')}>
            Todos <span>{counts.total}</span>
          </button>
          <button className={type === '5' ? 'active' : ''} onClick={() => selectType('5')}>
            Avulsos <span>{counts.avulsos}</span>
          </button>
          <button className={type === '4' ? 'active' : ''} onClick={() => selectType('4')}>
            Recorrentes <span>{counts.recorrentes}</span>
          </button>
        </div>

        <div className="student-list">
          {loading && <p className="list-status">Carregando alunos…</p>}
          {students.map((student) => (
            <button type="button" onClick={() => selectStudent(student.id)} key={student.id}>
              <div className="student-avatar">{student.nome.slice(0, 1)}</div>
              <div>
                <strong>{student.nome}</strong>
                <StudentTypeBadge type={student.type} />
              </div>
              <div className="student-contact">{student.phones?.[0]?.numero || 'Sem telefone'}</div>
              <span className="student-next">›</span>
            </button>
          ))}
          {!loading && !error && students.length === 0 && <p className="list-status">Nenhum aluno encontrado.</p>}
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

      {selected && <StudentDetailsSheet student={selected} token={token} onClose={() => setSelected(null)} onUpdated={(updated) => {
        setSelected(updated)
        setStudents((items) => items.map((item) => item.id === updated.id ? { ...item, ...updated } : item))
      }} />}
    </main>
  )
}
