import { useEffect, useState } from 'react'
import { findAddressByCep } from '../../lib/appointmentLocation'
import AcademyPickerModal from '../academies/AcademyPickerModal'
import { formatCep, onlyDigits } from '../../lib/masks'
import { estimateTravel } from '../../lib/api'

export default function AppointmentLocationFields({ token, value, onChange }) {
  const [loadingCep, setLoadingCep] = useState(false)
  const [cepError, setCepError] = useState('')
  const [showAcademies, setShowAcademies] = useState(false)
  const [calculatingTravel, setCalculatingTravel] = useState(false)
  const [travelError, setTravelError] = useState('')
  const [travelEstimate, setTravelEstimate] = useState(null)

  useEffect(() => {
    if (value.local_tipo !== 'domicilio' || value.local_cep.length !== 8) {
      setCepError('')
      return undefined
    }

    const controller = new AbortController()
    setLoadingCep(true)
    setCepError('')
    findAddressByCep(value.local_cep, controller.signal)
      .then((address) => onChange({ ...value, ...address }))
      .catch((error) => {
        if (error.name !== 'AbortError') setCepError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCep(false)
      })

    return () => controller.abort()
  }, [value.local_cep, value.local_tipo])

  function update(field, fieldValue) {
    setTravelEstimate(null)
    setTravelError('')
    onChange({
      ...value,
      [field]: fieldValue,
      local_latitude: null,
      local_longitude: null,
      rota_distancia_metros: null,
      rota_duracao_segundos: null,
      rota_calculada_em: null,
    })
  }

  function currentPosition() {
    if (!navigator.geolocation) return Promise.reject(new Error('Seu navegador não oferece localização para calcular a rota.'))
    return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    }))
  }

  async function calculateTravel() {
    try {
      setCalculatingTravel(true)
      setTravelError('')
      const position = await currentPosition()
      const estimate = await estimateTravel(token, {
        ...value,
        origem_latitude: position.coords.latitude,
        origem_longitude: position.coords.longitude,
      })
      setTravelEstimate(estimate)
      onChange({
        ...value,
        deslocamento_antes_minutos: estimate.suggested_travel_minutes,
        deslocamento_depois_minutos: estimate.suggested_travel_minutes,
        local_latitude: estimate.destination.latitude,
        local_longitude: estimate.destination.longitude,
        rota_distancia_metros: estimate.distance_meters,
        rota_duracao_segundos: estimate.duration_seconds,
        rota_calculada_em: estimate.calculated_at,
      })
    } catch (error) {
      const geoError = error?.code === 1
        ? 'Permita o acesso à sua localização para calcular a rota.'
        : error.message
      setTravelError(geoError || 'Não foi possível calcular o deslocamento agora.')
    } finally {
      setCalculatingTravel(false)
    }
  }

  function setTravelMinutes(field, input) {
    const minutes = input === '' ? undefined : Math.min(240, Math.max(0, Number(input)))
    onChange({ ...value, [field]: Number.isFinite(minutes) ? minutes : undefined })
  }

  const visibleEstimate = travelEstimate || (value.rota_distancia_metros ? {
    distance_meters: value.rota_distancia_metros,
    duration_minutes: Math.ceil((value.rota_duracao_segundos || 0) / 60),
    suggested_travel_minutes: value.deslocamento_antes_minutos,
  } : null)

  return (
    <fieldset className="appointment-location-fields">
      <legend>Onde será o atendimento?</legend>
      <div className="location-type-options">
        <button
          type="button"
          className={value.local_tipo === 'academia' ? 'active' : ''}
          onClick={() => update('local_tipo', 'academia')}
        >
          <span aria-hidden="true">🏋️</span>
          <strong>Na academia</strong>
        </button>
        <button
          type="button"
          className={value.local_tipo === 'domicilio' ? 'active' : ''}
          onClick={() => update('local_tipo', 'domicilio')}
        >
          <span aria-hidden="true">⌂</span>
          <strong>Em domicílio</strong>
        </button>
      </div>

      {value.local_tipo === 'academia' ? (
        <div className="appointment-academy-choice">
          <button type="button" className="academy-picker-trigger" onClick={() => setShowAcademies(true)}>
            <span aria-hidden="true">⌖</span>
            <span><small>SELECIONAR NO MAPA</small><strong>{value.academia_nome || 'Escolher academia'}</strong></span>
            <b>›</b>
          </button>
          <label>
            Nome manual da academia
            <input
              required
              placeholder="Use se o mapa estiver indisponível"
              value={value.academia_nome}
              onChange={(event) => update('academia_nome', event.target.value)}
            />
            <small>O nome manual mantém o agendamento funcionando mesmo se a API estiver fora.</small>
          </label>
          {showAcademies && (
            <AcademyPickerModal
              token={token}
              selectedId={value.academia_id}
              onClose={() => setShowAcademies(false)}
              onSelect={(academy) => {
                setTravelEstimate(null)
                setTravelError('')
                onChange({ ...value, academia_id: academy.id, academia_nome: academy.nome, local_latitude: null, local_longitude: null, rota_distancia_metros: null, rota_duracao_segundos: null, rota_calculada_em: null })
              }}
            />
          )}
        </div>
      ) : (
        <div className="location-address-grid">
          <label>
            CEP
            <input
              required
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength="9"
              placeholder="00000-000"
              value={formatCep(value.local_cep)}
              onChange={(event) => update('local_cep', onlyDigits(event.target.value).slice(0, 8))}
            />
            <small>{loadingCep ? 'Buscando endereço no ViaCEP…' : 'Preenchemos o endereço automaticamente.'}</small>
            {cepError && <span className="field-error">{cepError}</span>}
          </label>
          <label>
            Número
            <input required inputMode="text" maxLength="20" value={value.local_numero} onChange={(event) => update('local_numero', event.target.value)} />
          </label>
          <label>
            Rua
            <input required value={value.local_rua} onChange={(event) => update('local_rua', event.target.value)} />
          </label>
          <label>
            Bairro
            <input value={value.local_bairro} onChange={(event) => update('local_bairro', event.target.value)} />
          </label>
          <label>
            Cidade
            <input required value={value.local_cidade} onChange={(event) => update('local_cidade', event.target.value)} />
          </label>
          <label>
            UF
            <input required maxLength="2" value={value.local_estado} onChange={(event) => update('local_estado', event.target.value.replace(/[^a-z]/gi, '').toUpperCase())} />
          </label>
          <label>
            Complemento
            <input value={value.local_complemento} onChange={(event) => update('local_complemento', event.target.value)} />
          </label>
          <label>
            Referência
            <input value={value.local_referencia} onChange={(event) => update('local_referencia', event.target.value)} />
          </label>
        </div>
      )}

      <section className="travel-estimate" aria-live="polite">
        <div>
          <strong>Deslocamento</strong>
          <small>A localização atual é usada somente para este cálculo.</small>
        </div>
        <button type="button" className="secondary-button" onClick={calculateTravel} disabled={calculatingTravel}>
          {calculatingTravel ? 'Calculando rota…' : 'Calcular com minha localização'}
        </button>
        {visibleEstimate && <p>🚗 {visibleEstimate.duration_minutes} min · {(visibleEstimate.distance_meters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km. Reserva sugerida: {visibleEstimate.suggested_travel_minutes} min.</p>}
        {travelError && <p className="field-error">{travelError}</p>}
        <div className="travel-buffer-fields">
          <label>Reserva antes (min)<input type="number" inputMode="numeric" min="0" max="240" placeholder="30" value={value.deslocamento_antes_minutos ?? ''} onChange={(event) => setTravelMinutes('deslocamento_antes_minutos', event.target.value)} /></label>
          <label>Reserva depois (min)<input type="number" inputMode="numeric" min="0" max="240" placeholder="30" value={value.deslocamento_depois_minutos ?? ''} onChange={(event) => setTravelMinutes('deslocamento_depois_minutos', event.target.value)} /></label>
        </div>
      </section>
    </fieldset>
  )
}
