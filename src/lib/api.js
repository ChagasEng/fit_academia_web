const apiUrl = window.__APP_CONFIG__?.apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export async function login(credentials) {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(credentials),
  })
  const data = await response.json()

  if (!response.ok) throw new Error(data.message || 'Não foi possível entrar.')
  return data
}

export async function getMenu(token) {
  const response = await fetch(`${apiUrl}/auth/menu`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
  if (!response.ok) throw new Error('Não foi possível carregar o menu.')
  return response.json()
}

export async function logout(token) {
  await fetch(`${apiUrl}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
}

export async function createStudent(token, student) {
  const response = await fetch(`${apiUrl}/personal/alunos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(student),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Não foi possível cadastrar o aluno.')
  return data
}

async function authorizedGet(path, token) {
  const response = await fetch(`${apiUrl}${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
  if (!response.ok) throw new Error('Não foi possível carregar os dados.')
  return response.json()
}

export function getStudents(token, page = 1, search = '', type = '') { return authorizedGet(`/personal/alunos?page=${page}&search=${encodeURIComponent(search)}&tipo=${type}`, token) }
export function getStudent(token, id) { return authorizedGet(`/personal/alunos/${id}`, token) }
export function getAppointments(token, start, end) { return authorizedGet(`/personal/agenda?inicio=${start}&fim=${end}`, token) }

export async function createAppointment(token, appointment) {
  const response = await fetch(`${apiUrl}/personal/agenda`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(appointment) })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Não foi possível salvar o agendamento.')
  return data
}

export function getPersonalProfile(token) { return authorizedGet('/personal/profile', token) }
export function getRevenue(token) { return authorizedGet('/personal/financeiro', token) }
export function getStudentHistory(token, id) { return authorizedGet(`/personal/alunos/${id}/historico`, token) }
export async function createContract(token, id, contract) { const response = await fetch(`${apiUrl}/personal/alunos/${id}/contratos`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(contract) }); if (!response.ok) throw new Error('Não foi possível salvar o plano.'); return response.json() }
export async function markInstallmentPaid(token, id) { const response = await fetch(`${apiUrl}/personal/parcelas/${id}/paga`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }); if (!response.ok) throw new Error('Não foi possível registrar o pagamento.'); return response.json() }
export async function createStudentNote(token, id, conteudo) { const response = await fetch(`${apiUrl}/personal/alunos/${id}/anotacoes`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ conteudo }) }); if (!response.ok) throw new Error('Não foi possível salvar a observação.'); return response.json() }

export async function updatePersonalProfile(token, profile) {
  const response = await fetch(`${apiUrl}/personal/profile`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(profile) })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Não foi possível atualizar o perfil.')
  return data
}
