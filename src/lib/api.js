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

export function getStudents(token) { return authorizedGet('/personal/alunos', token) }
export function getAppointments(token, start, end) { return authorizedGet(`/personal/agenda?inicio=${start}&fim=${end}`, token) }
