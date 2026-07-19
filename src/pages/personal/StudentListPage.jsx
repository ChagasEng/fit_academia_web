import { useEffect, useState } from 'react'
import { getStudent, getStudents } from '../../lib/api'
import BackButton from '../../components/navigation/BackButton'

export default function StudentListPage({ token, onLogout }) {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 })
  const [counts, setCounts] = useState({ total: 0, recorrentes: 0, avulsos: 0 })
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const timeout = setTimeout(() => getStudents(token, page, search, type).then((data) => { setStudents(data.students?.data || []); setPagination(data.students || {}); setCounts(data.counts || {}) }).catch(() => setStudents([])), 250)
    return () => clearTimeout(timeout)
  }, [token, page, search, type])

  function selectType(nextType) { setType(nextType); setPage(1) }
  async function selectStudent(id) { setSelected(await getStudent(token, id)) }

  return <main className="dashboard-page registration-page"><header className="dashboard-header"><div className="header-side"><BackButton fallback="/personal" /><strong>fit<span>academia</span></strong></div><button onClick={onLogout}>Sair</button></header><section className="registration-content"><p className="eyebrow">PERSONAL</p><h1>Alunos cadastrados</h1><p>Todos os alunos vinculados ao seu atendimento.</p><div className="student-filters"><button className={!type ? 'active' : ''} onClick={() => selectType('')}>Todos <span>{counts.total}</span></button><button className={type === '5' ? 'active' : ''} onClick={() => selectType('5')}>Avulsos <span>{counts.avulsos}</span></button><button className={type === '4' ? 'active' : ''} onClick={() => selectType('4')}>Recorrentes <span>{counts.recorrentes}</span></button></div><input className="student-search" type="search" placeholder="Pesquisar por nome" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /><div className="student-list">{students.map((student) => <button type="button" onClick={() => selectStudent(student.id)} key={student.id}><div className="student-avatar">{student.nome.slice(0, 1)}</div><div><strong>{student.nome}</strong><span>{student.type?.nome}</span></div><div className="student-contact">{student.phones?.[0]?.numero || 'Sem telefone'}</div><span className="student-next">›</span></button>)}{students.length === 0 && <p>Nenhum aluno encontrado.</p>}</div>{pagination.last_page > 1 && <div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button><span>Página {pagination.current_page} de {pagination.last_page}</span><button disabled={page === pagination.last_page} onClick={() => setPage(page + 1)}>Próxima</button></div>}</section>{selected && <StudentDetails student={selected} onClose={() => setSelected(null)} />}</main>
}

function StudentDetails({ student, onClose }) {
  const address = student.addresses?.[0]
  const phone = student.phones?.[0]
  return <section className="student-sheet" role="dialog" aria-modal="true" aria-label="Dados do aluno"><div className="day-sheet-header"><div><p className="eyebrow">CADASTRO DO ALUNO</p><h2>{student.nome}</h2></div><button onClick={onClose} aria-label="Fechar dados">×</button></div><dl className="student-details"><div><dt>Tipo</dt><dd>{student.type?.nome}</dd></div><div><dt>E-mail</dt><dd>{student.email || 'Não informado'}</dd></div><div><dt>Telefone</dt><dd>{phone?.numero || 'Não informado'}</dd></div><div><dt>CEP</dt><dd>{address?.cep || 'Não informado'}</dd></div><div className="full"><dt>Endereço</dt><dd>{address ? `${address.rua || ''}, ${address.numero || 's/n'} — ${address.bairro || ''}, ${address.cidade || ''}/${address.estado || ''}` : 'Não informado'}</dd></div><div className="full"><dt>Complemento / referência</dt><dd>{[address?.complemento, address?.referencia].filter(Boolean).join(' · ') || 'Não informado'}</dd></div></dl></section>
}
