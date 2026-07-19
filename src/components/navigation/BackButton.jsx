export default function BackButton({ fallback = '/' }) {
  function goBack() {
    const parts = window.location.pathname.split('/').filter(Boolean)

    const isStudentHistory = parts[0] === 'personal' && parts[1] === 'alunos' && parts[3] === 'historico'
    const destination = isStudentHistory ? '/personal/alunos' : fallback !== '/' ? fallback : (parts.length > 1 ? `/${parts.slice(0, -1).join('/')}` : '/')
    window.history.pushState({}, '', destination)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return <button className="back-button" type="button" onClick={goBack} aria-label="Voltar para a tela anterior">
    <span aria-hidden="true">←</span><span>Voltar</span>
  </button>
}
