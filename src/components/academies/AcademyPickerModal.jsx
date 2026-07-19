import { useCallback, useEffect, useState } from 'react'
import { getAcademies } from '../../lib/api'
import AcademyMap from './AcademyMap'

export default function AcademyPickerModal({ token, selectedId, onSelect, onClose }) {
  const [data, setData] = useState(null)
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

  function choose(academy) {
    onSelect(academy)
    onClose()
  }

  return (
    <section className="academy-picker-backdrop" role="dialog" aria-modal="true" aria-label="Selecionar academia">
      <div className="academy-picker-modal">
        <header>
          <div>
            <p className="eyebrow">OPENSTREETMAP</p>
            <h2>Escolha a academia</h2>
            <span>{data ? `${data.city} · ${data.state}` : 'Carregando município…'}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar mapa">×</button>
        </header>

        {data?.message && <p className="map-warning">{data.message}</p>}
        {error && <div className="map-warning"><span>{error}</span><button type="button" onClick={load}>Tentar novamente</button></div>}

        <input
          className="academy-filter"
          type="search"
          placeholder="Pesquisar academia no mapa"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="academy-picker-layout">
          <AcademyMap academies={filtered} selectedId={selectedId} onSelect={choose} />
          <div className="academy-picker-list">
            {filtered.map((academy) => (
              <button type="button" className={Number(selectedId) === Number(academy.id) ? 'selected' : ''} key={academy.id} onClick={() => choose(academy)}>
                <strong>{academy.nome}</strong>
                <span>{academy.endereco || `${academy.cidade || data?.city} · ${academy.estado || data?.state}`}</span>
              </button>
            ))}
            {data && filtered.length === 0 && <p>Nenhuma academia encontrada com esse nome.</p>}
          </div>
        </div>

        <small>Dados de academias © contribuidores do OpenStreetMap.</small>
      </div>
    </section>
  )
}
