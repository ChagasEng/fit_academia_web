const key = 'fit_academia_session'

export function readSession() {
  const value = localStorage.getItem(key)
  return value ? JSON.parse(value) : null
}

export function saveSession(session) {
  localStorage.setItem(key, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(key)
}

export const rolePaths = {
  admin: '/admin',
  personal: '/personal',
  professor: '/professor',
  aluno_recorrente: '/aluno',
  aluno_avulso: '/aluno',
}
