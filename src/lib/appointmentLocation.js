export const emptyAppointmentLocation = {
  local_tipo: 'academia',
  academia_nome: '',
  local_cep: '',
  local_estado: '',
  local_cidade: '',
  local_bairro: '',
  local_rua: '',
  local_numero: '',
  local_complemento: '',
  local_referencia: '',
}

export function locationFromAppointment(appointment = {}) {
  return Object.fromEntries(
    Object.keys(emptyAppointmentLocation).map((key) => [key, appointment[key] || emptyAppointmentLocation[key]]),
  )
}

export function locationFromStudentAddress(address = {}) {
  return {
    ...emptyAppointmentLocation,
    local_tipo: 'domicilio',
    local_cep: address.cep || '',
    local_estado: address.estado || '',
    local_cidade: address.cidade || '',
    local_bairro: address.bairro || '',
    local_rua: address.rua || '',
    local_numero: address.numero || '',
    local_complemento: address.complemento || '',
    local_referencia: address.referencia || '',
  }
}

export function studentAddressFromLocation(location) {
  return {
    cep: location.local_cep,
    estado: location.local_estado,
    cidade: location.local_cidade,
    bairro: location.local_bairro,
    rua: location.local_rua,
    numero: location.local_numero,
    complemento: location.local_complemento,
    referencia: location.local_referencia,
  }
}

export async function findAddressByCep(value, signal) {
  const cep = value.replace(/\D/g, '').slice(0, 8)
  if (cep.length !== 8) throw new Error('Digite os 8 números do CEP.')

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal })
  if (!response.ok) throw new Error('Não foi possível consultar o CEP agora.')

  const data = await response.json()
  if (data.erro) throw new Error('CEP não encontrado. Confira os números digitados.')

  return {
    local_cep: cep,
    local_estado: data.uf || '',
    local_cidade: data.localidade || '',
    local_bairro: data.bairro || '',
    local_rua: data.logradouro || '',
  }
}

export function appointmentLocationLabel(appointment) {
  if (appointment.local_tipo === 'academia') return appointment.academia_nome || 'Academia não informada'
  if (appointment.local_tipo === 'domicilio') {
    return [
      [appointment.local_rua, appointment.local_numero].filter(Boolean).join(', '),
      appointment.local_bairro,
      appointment.local_cidade,
      appointment.local_estado,
    ].filter(Boolean).join(' · ') || 'Endereço não informado'
  }
  return 'Local não informado'
}
