export const onlyDigits = (value = '') => String(value).replace(/\D/g, '')

export function formatCep(value) {
  const digits = onlyDigits(value).slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

export function formatPhone(value) {
  let digits = onlyDigits(value).slice(0, 13)
  const country = digits.startsWith('55') && digits.length > 11 ? '+55 ' : ''
  if (country) digits = digits.slice(2)
  if (digits.length <= 2) return `${country}${digits ? `(${digits}` : ''}`
  if (digits.length <= 6) return `${country}(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `${country}(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `${country}(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export function formatCurrency(value) {
  const digits = onlyDigits(value)
  if (!digits) return ''
  return (Number(digits) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function currencyToCents(value) {
  const digits = onlyDigits(value)
  return digits ? Number(digits) : 0
}

export function formatCref(value) {
  const compact = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^CREF/, '')
  const number = (compact.match(/^\d{0,6}/)?.[0] || '')
  const suffix = compact.slice(number.length)
  const category = suffix.slice(0, 1)
  const state = suffix.slice(1, 3)
  if (!number) return ''
  return `CREF ${number}${category ? `-${category}` : ''}${state ? `/${state}` : ''}`
}
