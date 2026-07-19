import { useEffect, useState } from 'react'
import { getStudents } from '../../lib/api'

export default function StudentQuickSearch({ token }) {
  const [query, setQuery] = useState('')
  const [students, setStudents] = useState([])

  useEffect(() => {
    if (query.trim().length < 1) {
      setStudents([])
      return
    }

    const timer = setTimeout(() => {
      getStudents(token, 1, query.trim())
        .then((data) => setStudents(data.students?.data || []))
        .catch(() => setStudents([]))
    }, 220)

    return () => clearTimeout(timer)
  }, [token, query])

  function selectStudent(id) {
    setQuery('')
    setStudents([])
    window.history.pushState({}, '', `/personal/alunos/${id}/historico`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return <div className="header-search"><label><span className="sr-only">Pesquisar aluno</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar aluno" type="search" /></label>{students.length > 0 && <div className="header-search-results">{students.map((student) => <button type="button" key={student.id} onClick={() => selectStudent(student.id)}><span className="header-search-avatar">{student.nome.slice(0, 1)}</span><span><strong>{student.nome}</strong><small>{student.type?.nome}</small></span></button>)}</div>}</div>
}
