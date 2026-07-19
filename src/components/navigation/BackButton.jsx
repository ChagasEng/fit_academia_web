export default function BackButton({ fallback = '/' }) {
  function goBack() {
    if (window.history.length > 1) window.history.back()
    else window.location.assign(fallback)
  }

  return <button className="back-button" type="button" onClick={goBack} aria-label="Voltar para a tela anterior">
    <span aria-hidden="true">←</span><span>Voltar</span>
  </button>
}
