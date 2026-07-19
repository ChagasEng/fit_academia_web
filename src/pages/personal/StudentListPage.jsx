import { useEffect, useState } from 'react'
import { getStudents } from '../../lib/api'
import BackButton from '../../components/navigation/BackButton'

export default function StudentListPage({ token, onLogout }) {
  const [students, setStudents] = useState([])
  useEffect(() => { getStudents(token).then((data) => setStudents(data.data || [])).catch(() => setStudents([])) }, [token])

  return <main className="dashboard-page registration-page"><header className="dashboard-header"><div className="header-side"><BackButton fallback="/personal" /><strong>fit<span>academia</span></strong></div><button onClick={onLogout}>Sair</button></header><section className="registration-content"><p className="eyebrow">PERSONAL</p><h1>Alunos cadastrados</h1><p>Todos os alunos vinculados ao seu atendimento.</p><div className="student-list">{students.map((student) => <article key={student.id}><div className="student-avatar">{student.nome.slice(0, 1)}</div><div><strong>{student.nome}</strong><span>{student.type?.nome}</span></div><div className="student-contact">{student.phones?.[0]?.numero || 'Sem telefone'}</div></article>)}{students.length === 0 && <p>Nenhum aluno cadastrado.</p>}</div></section></main>
}
