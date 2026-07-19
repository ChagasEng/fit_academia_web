import { useCallback, useEffect, useState } from 'react'
import { getAcademies } from '../../lib/api'
import { searchText } from '../../lib/text'
import AcademyMap from './AcademyMap'

const precisionLabel = (academy) => {
  if (academy.latitude === null || academy.longitude === null) return 'Sem posição no mapa'
  if (academy.localizacao_precisao === 'CONFIRMADA') return 'Localização confirmada'
  if (academy.localizacao_precisao === 'APROXIMADA') return 'Localização aproximada'
  if (academy.localizacao_precisao === 'REVISAR') return 'Localização a revisar'
  return 'Localização via OpenStreetMap'
}

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
  const filtered = academies.filter((academy) => searchText(academy.nome).includes(searchText(query)))

  function choose(academy) {
    onSelect(academy)
    onClose()
  }

  return (
    <section className="academy-picker-backdrop" role="dialog" aria-modal="true" aria-label="Selecionar academia">
      <div className="academy-picker-modal">
        <header>
          <div>
            <p className="eyebrow">DIRETÓRIO DE ACADEMIAS</p>
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
              <button type="button" className={`${Number(selectedId) === Number(academy.id) ? 'selected' : ''}${academy.latitude === null || academy.longitude === null ? ' academy-unmapped' : ''}`} key={academy.id} onClick={() => choose(academy)}>
                <strong>{academy.nome}</strong>
                <span>{academy.endereco || `${academy.cidade || data?.city} · ${academy.estado || data?.state}`}</span>
                <small className={`academy-precision precision-${academy.localizacao_precisao?.toLowerCase() || 'osm'}`}>{precisionLabel(academy)}</small>
              </button>
            ))}
            {data && filtered.length === 0 && <p>Nenhuma academia encontrada com esse nome.</p>}
          </div>
        </div>

        <small>Diretório local e dados de localização © contribuidores do OpenStreetMap.</small>
      </div>
    </section>
  )
}
