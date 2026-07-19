import { useEffect, useState } from 'react'
import { findAddressByCep } from '../../lib/appointmentLocation'

export default function AppointmentLocationFields({ value, onChange }) {
  const [loadingCep, setLoadingCep] = useState(false)
  const [cepError, setCepError] = useState('')

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
    onChange({ ...value, [field]: fieldValue })
  }

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
        <label>
          Nome da academia
          <input
            required
            placeholder="Ex.: Smart Fit Centro"
            value={value.academia_nome}
            onChange={(event) => update('academia_nome', event.target.value)}
          />
        </label>
      ) : (
        <div className="location-address-grid">
          <label>
            CEP
            <input
              required
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength="8"
              placeholder="00000000"
              value={value.local_cep}
              onChange={(event) => update('local_cep', event.target.value.replace(/\D/g, '').slice(0, 8))}
            />
            <small>{loadingCep ? 'Buscando endereço no ViaCEP…' : 'Preenchemos o endereço automaticamente.'}</small>
            {cepError && <span className="field-error">{cepError}</span>}
          </label>
          <label>
            Número
            <input required value={value.local_numero} onChange={(event) => update('local_numero', event.target.value)} />
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
            <input required maxLength="2" value={value.local_estado} onChange={(event) => update('local_estado', event.target.value.toUpperCase())} />
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
    </fieldset>
  )
}
