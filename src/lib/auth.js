const key = 'fit_academia_session'

export function readSession() {
  try {
    const value = localStorage.getItem(key)
    if (!value) return null

    const session = JSON.parse(value)
    if (!session?.token || !session?.access?.slug || !session?.user) {
      localStorage.removeItem(key)
      return null
    }

    return session
  } catch {
    try { localStorage.removeItem(key) } catch { /* armazenamento indisponível */ }
    return null
  }
}

export function saveSession(session) {
  try { localStorage.setItem(key, JSON.stringify(session)) } catch { /* a sessão continua válida nesta aba */ }
}

export function clearSession() {
  try { localStorage.removeItem(key) } catch { /* armazenamento indisponível */ }
}

export const rolePaths = {
  admin: '/admin',
  personal: '/personal',
  professor: '/professor',
  aluno_recorrente: '/aluno',
  aluno_avulso: '/aluno',
}
