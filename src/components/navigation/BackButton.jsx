export default function BackButton({ fallback = '/' }) {
  const parts = window.location.pathname.split('/').filter(Boolean)

  function goBack() {
    const isStudentHistory = parts[0] === 'personal' && parts[1] === 'alunos' && parts[3] === 'historico'
    const destination = isStudentHistory ? '/personal/alunos' : fallback !== '/' ? fallback : (parts.length > 1 ? `/${parts.slice(0, -1).join('/')}` : '/')
    window.history.pushState({}, '', destination)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  if (parts.length <= 1 && fallback === '/') return null

  return <button className="back-button" type="button" onClick={goBack} aria-label="Voltar para a tela anterior">
    <span aria-hidden="true">←</span><span>Voltar</span>
  </button>
}
