const apiUrl = window.__APP_CONFIG__?.apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

async function result(response, fallback) {
  if (response.status === 401) window.dispatchEvent(new CustomEvent('auth:expired'))
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (response.status === 402) window.dispatchEvent(new CustomEvent('subscription:blocked', { detail: data?.subscription }))
  if (!response.ok) throw new Error(data?.message || Object.values(data?.errors || {})?.[0]?.[0] || fallback)
  return data
}

async function request(path, options, fallback) {
  let response
  try {
    response = await fetch(`${apiUrl}${path}`, options)
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Sem conexão com o servidor. Confira sua internet e tente novamente.')
  }
  return result(response, fallback)
}

const authHeaders = (token, json = false) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
  ...(json ? { 'Content-Type': 'application/json' } : {}),
})

export async function login(credentials) {
  return request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(credentials),
  }, 'Não foi possível entrar.')
}

export async function getMenu(token) {
  return request('/auth/menu', { headers: authHeaders(token) }, 'Não foi possível carregar o menu.')
}

export async function logout(token) {
  return request('/auth/logout', { method: 'POST', headers: authHeaders(token) }, 'Não foi possível encerrar a sessão no servidor.')
}

export async function createStudent(token, student) {
  return request('/personal/alunos', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify(student),
  }, 'Não foi possível cadastrar o aluno.')
}

async function authorizedGet(path, token, signal) {
  return request(path, { headers: authHeaders(token), signal }, 'Não foi possível carregar os dados.')
}

export function getStudents(token, page = 1, search = '', type = '', active = '', signal) { return authorizedGet(`/personal/alunos?page=${page}&search=${encodeURIComponent(search)}&tipo=${type}&ativo=${active}`, token, signal) }
export function getStudent(token, id) { return authorizedGet(`/personal/alunos/${id}`, token) }
export function getAppointments(token, start, end) { return authorizedGet(`/personal/agenda?inicio=${start}&fim=${end}`, token) }
export function getAvailableAppointmentTimes(token, options, signal) {
  const params = new URLSearchParams({
    data: options.date,
    duracao_minutos: String(options.durationMinutes),
    deslocamento_antes_minutos: String(options.beforeMinutes || 0),
    deslocamento_depois_minutos: String(options.afterMinutes || 0),
  })
  if (options.ignoreAppointmentId) params.set('ignorar_agendamento_id', String(options.ignoreAppointmentId))
  return authorizedGet(`/personal/agenda/horarios-disponiveis?${params}`, token, signal)
}
export function getAcademies(token) { return authorizedGet('/personal/academias', token) }
export function getAcademy(token, id) { return authorizedGet(`/personal/academias/${id}`, token) }
export function estimateTravel(token, destination) {
  return request('/personal/agenda/estimar-deslocamento', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify(destination),
  }, 'Não foi possível calcular o deslocamento.')
}

export async function createAppointment(token, appointment) {
  return request('/personal/agenda', { method: 'POST', headers: authHeaders(token, true), body: JSON.stringify(appointment) }, 'Não foi possível salvar o agendamento.')
}
export async function updateAppointment(token, id, appointment) {
  return request(`/personal/agenda/${id}`, { method: 'PATCH', headers: authHeaders(token, true), body: JSON.stringify(appointment) }, 'Não foi possível atualizar o agendamento.')
}
export async function updateAppointmentRecurrence(token, group, recurrence) {
  return request(`/personal/agenda/recorrencias/${group}`, { method: 'PATCH', headers: authHeaders(token, true), body: JSON.stringify(recurrence) }, 'Não foi possível atualizar a rotina do aluno.')
}
export async function deleteAppointment(token, id) {
  return request(`/personal/agenda/${id}`, { method: 'DELETE', headers: authHeaders(token) }, 'Não foi possível excluir o agendamento.')
}

export function getPersonalProfile(token) { return authorizedGet('/personal/profile', token) }
export function getRevenue(token) { return authorizedGet('/personal/financeiro', token) }
export function getStudentHistory(token, id) { return authorizedGet(`/personal/alunos/${id}/historico`, token) }
export function createStudentWhatsappContact(token, id, tipo, appointmentId = null) {
  return request(`/personal/alunos/${id}/contatos`, {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify({ tipo, ...(appointmentId ? { agendamento_id: appointmentId } : {}) }),
  }, 'Não foi possível preparar a mensagem do WhatsApp.')
}
export function updateStudent(token, id, student) { return request(`/personal/alunos/${id}`, { method: 'PATCH', headers: authHeaders(token, true), body: JSON.stringify(student) }, 'Não foi possível atualizar o aluno.') }
export function createContract(token, id, contract) { return request(`/personal/alunos/${id}/contratos`, { method: 'POST', headers: authHeaders(token, true), body: JSON.stringify(contract) }, 'Não foi possível salvar o plano.') }
export function markInstallmentPaid(token, id) { return request(`/personal/parcelas/${id}/paga`, { method: 'PATCH', headers: authHeaders(token) }, 'Não foi possível registrar o pagamento.') }
export function createStudentNote(token, id, conteudo) { return request(`/personal/alunos/${id}/anotacoes`, { method: 'POST', headers: authHeaders(token, true), body: JSON.stringify({ conteudo }) }, 'Não foi possível salvar a observação.') }

export async function updatePersonalProfile(token, profile) {
  return request('/personal/profile', { method: 'PUT', headers: authHeaders(token, true), body: JSON.stringify(profile) }, 'Não foi possível atualizar o perfil.')
}

export function getAdminUsers(token, search = '', type = '', signal) {
  return authorizedGet(`/admin/usuarios?search=${encodeURIComponent(search)}&tipo=${type}`, token, signal)
}

export function createAdminUser(token, user) {
  return request('/admin/usuarios', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify(user),
  }, 'Não foi possível cadastrar o profissional.')
}

export function markPersonalSubscriptionPaid(token, userId) {
  return request(`/admin/usuarios/${userId}/mensalidade/paga`, {
    method: 'PATCH',
    headers: authHeaders(token),
  }, 'Não foi possível confirmar o pagamento.')
}

export function getPersonalSubscription(token) {
  return authorizedGet('/personal/assinatura', token)
}

export function getTelegramIntegration(token) {
  return authorizedGet('/personal/telegram', token)
}

export function validateTelegramBot(token, botToken) {
  return request('/personal/telegram/validar', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify({ token: botToken }),
  }, 'Não foi possível validar o bot.')
}

export function connectTelegramBot(token, botToken, autoConfirm = false) {
  return request('/personal/telegram/conectar', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify({ token: botToken, telegram_auto_confirm: autoConfirm }),
  }, 'Não foi possível conectar o bot.')
}

export function updateTelegramSettings(token, autoConfirm) {
  return request('/personal/telegram', {
    method: 'PATCH',
    headers: authHeaders(token, true),
    body: JSON.stringify({ telegram_auto_confirm: autoConfirm }),
  }, 'Não foi possível atualizar as configurações do Telegram.')
}

export function disconnectTelegramBot(token) {
  return request('/personal/telegram', {
    method: 'DELETE',
    headers: authHeaders(token),
  }, 'Não foi possível desconectar o bot.')
}
