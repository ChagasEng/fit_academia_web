import { useCallback, useEffect, useState } from 'react'
import AcademyMap from '../../components/academies/AcademyMap'
import BackButton from '../../components/navigation/BackButton'
import StudentQuickSearch from '../../components/students/StudentQuickSearch'
import { getAcademies, getAcademy } from '../../lib/api'
import { searchText } from '../../lib/text'

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
  const filtered = academies.filter((academy) => searchText(academy.nome).includes(searchText(query)))
  const mappedAcademies = academies.filter((academy) => academy.latitude !== null && academy.longitude !== null)
  const confirmedAcademies = academies.filter((academy) => academy.localizacao_precisao === 'CONFIRMADA')
  const approximateAcademies = academies.filter((academy) => academy.localizacao_precisao === 'APROXIMADA')
  const reviewAcademies = academies.filter((academy) => academy.localizacao_precisao === 'REVISAR')

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

  function openHistory(student) {
    window.history.pushState({ studentName: student.nome }, '', `/personal/alunos/${student.id}/historico`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  function retry() {
    const academy = academies.find((item) => Number(item.id) === Number(selectedId))
    if (academy) selectAcademy(academy)
    else load()
  }

  return (
    <main className="dashboard-page academy-page">
      <header className="dashboard-header">
        <div className="header-side"><BackButton fallback="/personal" /><strong>fit<span>academia</span></strong></div>
        <div className="header-actions"><StudentQuickSearch token={token} /><button onClick={onLogout}>Sair</button></div>
      </header>

      <section className="academy-page-content">
        <div className="academy-page-heading">
          <div>
            <p className="eyebrow">MAPA DE ACADEMIAS</p>
            <h1>Academias em {data?.city || 'Ponta Grossa'}</h1>
            <p>{academies.length} academias cadastradas · {mappedAcademies.length} com ponto no mapa.</p>
          </div>
          <input type="search" placeholder="Pesquisar academia" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>

        {data?.message && <p className="map-warning">{data.message}</p>}
        {error && <div className="map-warning"><span>{error}</span><button type="button" onClick={retry}>Tentar novamente</button></div>}
        <div className="academy-map-legend" aria-label="Precisão dos pontos no mapa">
          <span className="confirmed">{confirmedAcademies.length} confirmadas</span>
          <span className="approximate">{approximateAcademies.length} aproximadas</span>
          <span className="review">{reviewAcademies.length} para revisar</span>
        </div>
        <p className="osm-coverage-note"><strong>Sobre a cobertura:</strong> a lista reúne OpenStreetMap e o diretório local de Ponta Grossa. Pontos aproximados e endereços que precisam de revisão aparecem com cores diferentes dos locais confirmados.</p>

        <div className="academy-page-layout">
          <AcademyMap academies={filtered} selectedId={selectedId} onSelect={selectAcademy} />
          <aside className="academy-details">
            {!selectedId && (
              <div className="academy-directory">
                <div className="academy-directory-heading">
                  <div><span>DIRETÓRIO</span><h2>{filtered.length} academias</h2></div>
                  <small>Selecione para ver alunos e horários.</small>
                </div>
                {!data && <p>Carregando academias…</p>}
                {data && filtered.length === 0 && <p>Nenhuma academia encontrada com esse nome.</p>}
                {filtered.map((academy) => {
                  const mapped = academy.latitude !== null && academy.longitude !== null
                  return (
                    <button type="button" key={academy.id} onClick={() => selectAcademy(academy)}>
                      <span className={mapped ? 'academy-location-status mapped' : 'academy-location-status'} aria-hidden="true">{mapped ? '⌖' : '•'}</span>
                      <span><strong>{academy.nome}</strong><small>{academy.endereco || `${academy.cidade} · ${academy.estado}`}</small><em className={`precision-${academy.localizacao_precisao?.toLowerCase() || 'osm'}`}>{academy.localizacao_precisao === 'CONFIRMADA' ? 'Confirmada' : academy.localizacao_precisao === 'APROXIMADA' ? 'Aproximada' : academy.localizacao_precisao === 'REVISAR' ? 'Revisar ponto' : 'OpenStreetMap'}</em></span>
                      <b>›</b>
                    </button>
                  )
                })}
              </div>
            )}
            {selectedId && !details && <p>Carregando alunos…</p>}
            {details && (
              <>
                <button type="button" className="academy-directory-back" onClick={() => { setSelectedId(null); setDetails(null) }}>← Ver todas</button>
                <div className="academy-details-heading">
                  <span>ACADEMIA</span>
                  <h2>{details.academy.nome}</h2>
                  <p>{details.academy.endereco || `${details.academy.cidade} · ${details.academy.estado}`}</p>
                  {details.academy.localizacao_precisao && <small className={`academy-detail-precision precision-${details.academy.localizacao_precisao.toLowerCase()}`}>{details.academy.localizacao_precisao === 'CONFIRMADA' ? 'Localização confirmada' : details.academy.localizacao_precisao === 'APROXIMADA' ? 'Localização aproximada' : 'Localização a revisar'}</small>}
                </div>
                <h3>{(details.students || []).length} {(details.students || []).length === 1 ? 'aluno vinculado' : 'alunos vinculados'}</h3>
                <div className="academy-students">
                  {(details.students || []).map((student) => {
                    const nextAppointment = student.appointments?.[0]
                    return (
                      <button type="button" key={student.id} onClick={() => openHistory(student)}>
                        <span className="student-avatar">{student.nome.slice(0, 1)}</span>
                        <span>
                          <strong>{student.nome}</strong>
                          <small>{nextAppointment ? `${nextAppointment.type?.nome} · ${appointmentDate(nextAppointment)}` : 'Sem próximo agendamento nesta academia'}</small>
                        </span>
                        <b>›</b>
                      </button>
                    )
                  })}
                  {(details.students || []).length === 0 && <p>Nenhum aluno foi vinculado a esta academia ainda.</p>}
                </div>
              </>
            )}
          </aside>
        </div>
        <small className="osm-credit">Mapa © contribuidores do OpenStreetMap · diretório local de academias.</small>
      </section>
    </main>
  )
}
