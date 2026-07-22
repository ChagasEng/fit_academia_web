import { useEffect, useRef, useState } from 'react'
import { getStudents } from '../../lib/api'

export default function StudentQuickSearch({ token }) {
  const [query, setQuery] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const close = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setStudents([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setStudents([])
    setLoading(true)
    const timer = setTimeout(() => {
      getStudents(token, 1, query.trim(), '', '', controller.signal)
        .then((data) => {
          setStudents(data.students?.data || [])
          setOpen(true)
        })
        .catch((error) => {
          if (error.name !== 'AbortError') setStudents([])
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, 220)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [token, query])

  function selectStudent(id) {
    setQuery('')
    setStudents([])
    window.history.pushState({}, '', `/personal/alunos/${id}/historico`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const showResults = open && query.trim().length >= 2

  return <div className="header-search" ref={containerRef}><label><span className="sr-only">Pesquisar aluno</span><input value={query} onFocus={() => setOpen(true)} onKeyDown={(event) => event.key === 'Escape' && setOpen(false)} onChange={(event) => { setQuery(event.target.value); setOpen(true) }} placeholder="Pesquisar aluno" type="search" /></label>{showResults && <div className="header-search-results">{students.map((student) => <button type="button" key={student.id} onClick={() => selectStudent(student.id)}><span className="header-search-avatar">{student.nome?.slice(0, 1) || '?'}</span><span><strong>{student.nome || 'Aluno sem nome'}</strong><small>{student.type?.nome || 'Tipo não informado'}</small></span></button>)}{loading && <p>Pesquisando…</p>}{!loading && students.length === 0 && <p>Nenhum aluno encontrado.</p>}</div>}</div>
}
