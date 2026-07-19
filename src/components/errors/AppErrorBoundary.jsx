import { Component } from 'react'
import { clearSession } from '../../lib/auth'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('Falha inesperada na interface:', error)
  }

  restart(clearLogin = false) {
    if (clearLogin) clearSession()
    window.location.assign(clearLogin ? '/' : window.location.pathname)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <main className="app-error-page">
        <section>
          <span aria-hidden="true">!</span>
          <h1>Algo saiu do lugar.</h1>
          <p>A tela encontrou um erro inesperado. Seus dados não foram apagados.</p>
          <div>
            <button type="button" onClick={() => this.restart()}>Tentar novamente</button>
            <button type="button" className="secondary-button" onClick={() => this.restart(true)}>Voltar ao login</button>
          </div>
        </section>
      </main>
    )
  }
}
