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
