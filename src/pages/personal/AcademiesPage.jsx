import { useCallback, useEffect, useState } from 'react'
import AcademyMap from '../../components/academies/AcademyMap'
import BackButton from '../../components/navigation/BackButton'
import { getAcademies, getAcademy } from '../../lib/api'

const appointmentDate = (appointment) => new Date(appointment.inicio).toLocaleString('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export default function AcademiesPage({ token, onLogout }) {
  const [data, setData] = useState(null)
  const [details, setDetails] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setError('')
      setData(await getAcademies(token))
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const academies = data?.academies || []
  const filtered = academies.filter((academy) => academy.nome.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')))

  const selectAcademy = useCallback(async (academy) => {
    setSelectedId(academy.id)
    setDetails(null)
    try {
      setError('')
      setDetails(await getAcademy(token, academy.id))
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [token])

  function openHistory(studentId) {
    window.history.pushState({}, '', `/personal/alunos/${studentId}/historico`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <main className="dashboard-page academy-page">
      <header className="dashboard-header">
        <div className="header-side"><BackButton fallback="/personal" /><strong>fit<span>academia</span></strong></div>
        <button onClick={onLogout}>Sair</button>
      </header>

      <section className="academy-page-content">
        <div className="academy-page-heading">
          <div>
            <p className="eyebrow">MAPA DE ACADEMIAS</p>
            <h1>Academias em {data?.city || 'Ponta Grossa'}</h1>
            <p>{academies.length} academias com localização cadastrada no OpenStreetMap.</p>
          </div>
          <input type="search" placeholder="Pesquisar academia" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>

        {data?.message && <p className="map-warning">{data.message}</p>}
        {error && <div className="map-warning"><span>{error}</span><button type="button" onClick={load}>Tentar novamente</button></div>}
        <p className="osm-coverage-note"><strong>Sobre a cobertura:</strong> o mapa mostra apenas estabelecimentos que possuem coordenadas e alguma classificação de academia/fitness no OpenStreetMap. Empresas presentes somente em outras listas públicas não têm uma posição confiável para marcar aqui.</p>

        <div className="academy-page-layout">
          <AcademyMap academies={filtered} selectedId={selectedId} onSelect={selectAcademy} />
          <aside className="academy-details">
            {!selectedId && <div className="academy-details-empty"><span>⌖</span><strong>Clique em uma academia</strong><p>Você verá os alunos vinculados e seus próximos horários.</p></div>}
            {selectedId && !details && <p>Carregando alunos…</p>}
            {details && (
              <>
                <div className="academy-details-heading">
                  <span>ACADEMIA</span>
                  <h2>{details.academy.nome}</h2>
                  <p>{details.academy.endereco || `${details.academy.cidade} · ${details.academy.estado}`}</p>
                </div>
                <h3>{details.students.length} {details.students.length === 1 ? 'aluno vinculado' : 'alunos vinculados'}</h3>
                <div className="academy-students">
                  {details.students.map((student) => {
                    const nextAppointment = student.appointments?.[0]
                    return (
                      <button type="button" key={student.id} onClick={() => openHistory(student.id)}>
                        <span className="student-avatar">{student.nome.slice(0, 1)}</span>
                        <span>
                          <strong>{student.nome}</strong>
                          <small>{nextAppointment ? `${nextAppointment.type?.nome} · ${appointmentDate(nextAppointment)}` : 'Sem próximo agendamento nesta academia'}</small>
                        </span>
                        <b>›</b>
                      </button>
                    )
                  })}
                  {details.students.length === 0 && <p>Nenhum aluno foi vinculado a esta academia ainda.</p>}
                </div>
              </>
            )}
          </aside>
        </div>
        <small className="osm-credit">Mapa e dados © contribuidores do OpenStreetMap.</small>
      </section>
    </main>
  )
}
