export default function BackButton({ fallback = '/' }) {
  function goBack() {
    const parts = window.location.pathname.split('/').filter(Boolean)

    // A navegação interna recarrega a aplicação; por isso usamos a hierarquia
    // da rota em vez do histórico do WebView, que pode variar entre plataformas.
    if (parts.length > 1) {
      window.location.assign(`/${parts[0]}`)
      return
    }

    window.location.assign(fallback)
  }

  return <button className="back-button" type="button" onClick={goBack} aria-label="Voltar para a tela anterior">
    <span aria-hidden="true">←</span><span>Voltar</span>
  </button>
}
