import { useEffect, useState } from 'react'
import { getStudent, getStudents } from '../../lib/api'
import BackButton from '../../components/navigation/BackButton'
import StudentDetailsSheet from '../../components/students/StudentDetailsSheet'
import StudentTypeBadge from '../../components/students/StudentTypeBadge'

export default function StudentListPage({ token, onLogout }) {
  const [students, setStudents] = useState([])
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 })
  const [counts, setCounts] = useState({ total: 0, recorrentes: 0, avulsos: 0 })
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getStudents(token, page, '', type)
      .then((data) => {
        setStudents(data.students?.data || [])
        setPagination(data.students || {})
        setCounts(data.counts || {})
      })
      .catch(() => setStudents([]))
  }, [token, page, type])

  function selectType(nextType) {
    setType(nextType)
    setPage(1)
  }

  async function selectStudent(id) {
    setSelected(await getStudent(token, id))
  }

  return (
    <main className="dashboard-page registration-page">
      <header className="dashboard-header">
        <div className="header-side">
          <BackButton fallback="/personal" />
          <strong>fit<span>academia</span></strong>
        </div>
        <button onClick={onLogout}>Sair</button>
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
          {students.length === 0 && <p>Nenhum aluno encontrado.</p>}
        </div>

        {pagination.last_page > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button>
            <span>Página {pagination.current_page} de {pagination.last_page}</span>
            <button disabled={page === pagination.last_page} onClick={() => setPage(page + 1)}>Próxima</button>
          </div>
        )}
      </section>

      {selected && <StudentDetailsSheet student={selected} onClose={() => setSelected(null)} />}
    </main>
  )
}
