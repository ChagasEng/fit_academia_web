const apiUrl = window.__APP_CONFIG__?.apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

async function result(response, fallback) {
  if (response.status === 401) window.dispatchEvent(new CustomEvent('auth:expired'))
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message || Object.values(data?.errors || {})?.[0]?.[0] || fallback)
  return data
}

export async function login(credentials) {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(credentials),
  })
  return result(response, 'Não foi possível entrar.')
}

export async function getMenu(token) {
  const response = await fetch(`${apiUrl}/auth/menu`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
  return result(response, 'Não foi possível carregar o menu.')
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
  return result(response, 'Não foi possível cadastrar o aluno.')
}

async function authorizedGet(path, token) {
  const response = await fetch(`${apiUrl}${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
  return result(response, 'Não foi possível carregar os dados.')
}

export function getStudents(token, page = 1, search = '', type = '') { return authorizedGet(`/personal/alunos?page=${page}&search=${encodeURIComponent(search)}&tipo=${type}`, token) }
export function getStudent(token, id) { return authorizedGet(`/personal/alunos/${id}`, token) }
export function getAppointments(token, start, end) { return authorizedGet(`/personal/agenda?inicio=${start}&fim=${end}`, token) }
export function getAcademies(token) { return authorizedGet('/personal/academias', token) }
export function getAcademy(token, id) { return authorizedGet(`/personal/academias/${id}`, token) }

export async function createAppointment(token, appointment) {
  const response = await fetch(`${apiUrl}/personal/agenda`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(appointment) })
  return result(response, 'Não foi possível salvar o agendamento.')
}
export async function updateAppointment(token, id, appointment) {
  const response = await fetch(`${apiUrl}/personal/agenda/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(appointment) })
  return result(response, 'Não foi possível atualizar o local do agendamento.')
}

export function getPersonalProfile(token) { return authorizedGet('/personal/profile', token) }
export function getRevenue(token) { return authorizedGet('/personal/financeiro', token) }
export function getStudentHistory(token, id) { return authorizedGet(`/personal/alunos/${id}/historico`, token) }
export async function updateStudent(token, id, student) { const response = await fetch(`${apiUrl}/personal/alunos/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(student) }); return result(response, 'Não foi possível atualizar o aluno.') }
export async function createContract(token, id, contract) { const response = await fetch(`${apiUrl}/personal/alunos/${id}/contratos`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(contract) }); return result(response, 'Não foi possível salvar o plano.') }
export async function markInstallmentPaid(token, id) { const response = await fetch(`${apiUrl}/personal/parcelas/${id}/paga`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }); return result(response, 'Não foi possível registrar o pagamento.') }
export async function createStudentNote(token, id, conteudo) { const response = await fetch(`${apiUrl}/personal/alunos/${id}/anotacoes`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ conteudo }) }); return result(response, 'Não foi possível salvar a observação.') }

export async function updatePersonalProfile(token, profile) {
  const response = await fetch(`${apiUrl}/personal/profile`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(profile) })
  return result(response, 'Não foi possível atualizar o perfil.')
}
