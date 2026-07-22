import { useEffect, useMemo, useState } from 'react'
import BackButton from '../../components/navigation/BackButton'
import StudentQuickSearch from '../../components/students/StudentQuickSearch'
import { getFinance, markInstallmentPaid } from '../../lib/api'

const statusLabels = { paid: 'Pago', pending: 'A vencer', overdue: 'Em atraso' }
const methodLabels = { pix: 'Pix', cartao: 'Cartão', dinheiro: 'Dinheiro' }
const pageSize = 8

function localMonth() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(value, amount) {
  const [year, month] = value.split('-').map(Number)
  const date = new Date(year, month - 1 + amount, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(value) {
  const [year, month] = value.split('-').map(Number)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const money = (value) => (Number(value || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const date = (value) => value ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '—'
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'AL'
const searchable = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function readInitialFilters() {
  const params = new URLSearchParams(window.location.search)
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.get('month') || '') ? params.get('month') : localMonth()
  const scope = ['month', 'overdue'].includes(params.get('scope')) ? params.get('scope') : 'month'
  const status = scope === 'month' && ['all', 'paid', 'pending', 'overdue'].includes(params.get('status')) ? params.get('status') : 'all'
  const method = ['all', 'pix', 'cartao', 'dinheiro'].includes(params.get('method')) ? params.get('method') : 'all'
  return { month, scope, status, method, search: params.get('search') || '', page: Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1) }
}

export default function FinancePage({ token, onLogout, onNavigate }) {
  const [initialFilters] = useState(readInitialFilters)
  const [month, setMonth] = useState(initialFilters.month)
  const [data, setData] = useState(null)
  const [scope, setScope] = useState(initialFilters.scope)
  const [status, setStatus] = useState(initialFilters.status)
  const [method, setMethod] = useState(initialFilters.method)
  const [search, setSearch] = useState(initialFilters.search)
  const [page, setPage] = useState(initialFilters.page)
  const [searchFocused, setSearchFocused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [actionId, setActionId] = useState(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setMessage('')
    setData((current) => current?.period?.month === month ? current : null)
    getFinance(token, month, controller.signal)
      .then(setData)
      .catch((requestError) => { if (requestError.name !== 'AbortError') setError(requestError.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, month, refresh])

  useEffect(() => {
    const params = new URLSearchParams({ month, scope, page: String(page) })
    if (scope === 'month' && status !== 'all') params.set('status', status)
    if (method !== 'all') params.set('method', method)
    if (search.trim()) params.set('search', search.trim())
    window.history.replaceState(window.history.state, '', `/personal/faturamento?${params}`)
  }, [method, month, page, scope, search, status])

  const sourceItems = useMemo(
    () => scope === 'overdue' ? data?.overdue?.installments || [] : data?.installments || [],
    [data, scope],
  )

  const items = useMemo(() => {
    const term = searchable(search.trim())
    return sourceItems.filter((item) => {
      if (scope === 'month' && status !== 'all' && item.status !== status) return false
      if (method !== 'all' && item.payment_method !== method) return false
      if (!term) return true
      return searchable(`${item.student.name} ${item.student.email || ''} ${item.contract.title}`).includes(term)
    })
  }, [method, scope, search, sourceItems, status])

  const studentSuggestions = useMemo(() => {
    const term = searchable(search.trim())
    if (!term) return []
    const students = new Map()
    sourceItems.forEach((item) => {
      if (!students.has(item.student.id)) students.set(item.student.id, { ...item.student, charges: 0 })
      students.get(item.student.id).charges += 1
    })
    return [...students.values()].filter((student) => searchable(student.name).includes(term)).slice(0, 6)
  }, [search, sourceItems])

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const firstVisible = items.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const lastVisible = Math.min(currentPage * pageSize, items.length)
  const paginationStart = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  const paginationPages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => paginationStart + index)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function changeMonth(nextMonth) {
    setMonth(nextMonth)
    setPage(1)
  }

  function selectScope(nextScope) {
    setScope(nextScope)
    setStatus('all')
    setSearch('')
    setPage(1)
  }

  function selectStudent(student) {
    setSearch(student.name)
    setSearchFocused(false)
    setPage(1)
  }

  function viewStudent(studentId) {
    const backTo = `${window.location.pathname}${window.location.search}`
    onNavigate(`/personal/alunos/${studentId}/historico`, false, { backTo })
  }

  async function pay(item) {
    if (!window.confirm(`Confirmar o recebimento de ${money(item.amount_cents)} de ${item.student.name}?`)) return
    setActionId(item.id)
    setError('')
    setMessage('')
    try {
      await markInstallmentPaid(token, item.id, item.payment_method || 'pix')
      setMessage(`Pagamento de ${item.student.name} registrado com sucesso.`)
      setRefresh((value) => value + 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setActionId(null)
    }
  }

  const summary = data?.summary || {}
  const overdue = data?.overdue || {}

  return (
    <main className="dashboard-page finance-page">
      <header className="dashboard-header">
        <div className="header-side"><BackButton fallback="/personal/perfil" /><strong>fit<span>academia</span></strong></div>
        <div className="header-actions"><StudentQuickSearch token={token} /><button onClick={onLogout}>Sair</button></div>
      </header>

      <section className="finance-content">
        <div className="finance-heading">
          <div><p className="eyebrow">CONTROLE FINANCEIRO</p><h1>Faturamento</h1><p>Veja com clareza o que entrou, o que ainda vence e quem precisa de atenção.</p></div>
          <div className="finance-month-control">
            <span>PERÍODO DE VENCIMENTO</span>
            <div><button type="button" aria-label="Mês anterior" onClick={() => changeMonth(shiftMonth(month, -1))}>‹</button><input type="month" value={month} onChange={(event) => changeMonth(event.target.value || localMonth())} /><button type="button" aria-label="Próximo mês" onClick={() => changeMonth(shiftMonth(month, 1))}>›</button></div>
            {month !== localMonth() && <button type="button" className="finance-current-month" onClick={() => changeMonth(localMonth())}>Voltar para o mês atual</button>}
          </div>
        </div>

        <div className="finance-period-title"><strong>{monthLabel(month)}</strong><span>Valores organizados pela data de vencimento das parcelas.</span></div>

        {loading && !data && <div className="finance-loading">Carregando faturamento…</div>}
        {data && <>
          <div className="finance-summary-grid">
            <article className="expected"><span>PREVISTO NO MÊS</span><strong>{money(summary.expected_cents)}</strong><small>{summary.total_count || 0} cobranças</small></article>
            <article className="received"><span>RECEBIDO</span><strong>{money(summary.received_cents)}</strong><small>{summary.paid_count || 0} pagamentos</small></article>
            <article className="outstanding"><span>SALDO A RECEBER</span><strong>{money(summary.outstanding_cents)}</strong><small>{(summary.pending_count || 0) + (summary.overdue_count || 0)} pendências no mês</small></article>
            <article className="overdue"><span>ATRASADO NO MÊS</span><strong>{money(summary.overdue_cents)}</strong><small>{summary.overdue_count || 0} cobranças vencidas</small></article>
          </div>

          <div className="finance-progress-card">
            <div><span>PROGRESSO DE RECEBIMENTO</span><strong>{summary.completion_percent || 0}%</strong></div>
            <div className="finance-progress-track"><span style={{ width: `${Math.min(summary.completion_percent || 0, 100)}%` }} /></div>
            <small>{money(summary.received_cents)} de {money(summary.expected_cents)} recebidos das cobranças de {monthLabel(month).toLowerCase()}.</small>
          </div>

          {overdue.count > 0 && <button type="button" className="finance-overdue-alert" onClick={() => selectScope('overdue')}>
            <span aria-hidden="true">!</span><span><small>PENDÊNCIAS ACUMULADAS</small><strong>{overdue.count} cobranças em atraso · {money(overdue.total_cents)}</strong><em>Inclui dívidas de todos os meses. Clique para conferir.</em></span><b aria-hidden="true">›</b>
          </button>}

          <section className="finance-ledger">
            <div className="finance-ledger-heading">
              <div><span>LANÇAMENTOS</span><h2>{scope === 'month' ? `Cobranças de ${monthLabel(month).toLowerCase()}` : 'Todas as pendências acumuladas'}</h2></div>
              <div className="finance-scope-tabs"><button type="button" className={scope === 'month' ? 'active' : ''} onClick={() => selectScope('month')}>Este mês <b>{summary.total_count || 0}</b></button><button type="button" className={scope === 'overdue' ? 'active overdue' : ''} onClick={() => selectScope('overdue')}>Em atraso <b>{overdue.count || 0}</b></button></div>
            </div>

            <div className="finance-filters">
              <label className="finance-search"><span className="sr-only">Buscar aluno ou plano</span><input type="search" role="combobox" aria-autocomplete="list" aria-expanded={searchFocused && studentSuggestions.length > 0} aria-controls="finance-student-suggestions" placeholder="Buscar aluno ou plano…" value={search} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} onChange={(event) => { setSearch(event.target.value); setSearchFocused(true); setPage(1) }} />{searchFocused && studentSuggestions.length > 0 && <div className="finance-search-suggestions" id="finance-student-suggestions" role="listbox">{studentSuggestions.map((student) => <button type="button" role="option" key={student.id} onMouseDown={(event) => event.preventDefault()} onClick={() => selectStudent(student)}><span className="finance-student-avatar" aria-hidden="true">{initials(student.name)}</span><span><strong>{student.name}</strong><small>{student.email || 'Sem e-mail cadastrado'} · {student.charges} {student.charges === 1 ? 'cobrança' : 'cobranças'}</small></span><b aria-hidden="true">›</b></button>)}</div>}</label>
              {scope === 'month' && <div className="finance-status-filters">{[['all', 'Todas'], ['paid', 'Pagas'], ['pending', 'A vencer'], ['overdue', 'Em atraso']].map(([value, label]) => <button type="button" key={value} className={status === value ? `active ${value}` : value} onClick={() => { setStatus(value); setPage(1) }}>{label}</button>)}</div>}
              <label className="finance-method-filter"><span className="sr-only">Filtrar forma de pagamento</span><select value={method} onChange={(event) => { setMethod(event.target.value); setPage(1) }}><option value="all">Todos os meios</option><option value="pix">Pix</option><option value="cartao">Cartão</option><option value="dinheiro">Dinheiro</option></select></label>
            </div>

            <div className="finance-results-summary"><span>{items.length === 0 ? 'Nenhuma cobrança encontrada' : `Exibindo ${firstVisible}–${lastVisible} de ${items.length} cobranças`}</span>{(search || method !== 'all' || status !== 'all') && <button type="button" onClick={() => { setSearch(''); setMethod('all'); setStatus('all'); setPage(1) }}>Limpar filtros</button>}</div>

            <div className="finance-payment-list">
              {visibleItems.map((item) => <article key={item.id} className={`finance-payment-row ${item.status}`}>
                <span className="finance-student-avatar" aria-hidden="true">{initials(item.student.name)}</span>
                <div className="finance-student"><strong>{item.student.name}</strong><small>{item.student.email || 'Sem e-mail cadastrado'}</small></div>
                <div className="finance-contract"><small>PLANO</small><strong>{item.contract.title}</strong><span>{item.installment_number}ª de {item.contract.installments_count} · {methodLabels[item.payment_method] || 'Não informado'}</span></div>
                <div className="finance-due"><small>{item.status === 'paid' ? 'PAGO EM' : 'VENCIMENTO'}</small><strong>{date(item.status === 'paid' ? item.paid_at : item.due_date)}</strong><span className={`finance-status ${item.status}`}>{statusLabels[item.status]}</span></div>
                <div className="finance-value"><strong>{money(item.amount_cents)}</strong>{item.status !== 'paid' && <button type="button" disabled={actionId === item.id} onClick={() => pay(item)}>{actionId === item.id ? 'Registrando…' : 'Marcar como pago'}</button>}<button type="button" className="finance-student-link" onClick={() => viewStudent(item.student.id)}>Ver aluno</button></div>
              </article>)}
              {!loading && items.length === 0 && <div className="finance-empty"><span aria-hidden="true">✓</span><strong>Nenhuma cobrança encontrada</strong><p>{scope === 'overdue' ? 'Não há pendências acumuladas com estes filtros.' : 'Ajuste os filtros ou selecione outro mês.'}</p></div>}
            </div>
            <nav className="finance-pagination" aria-label="Paginação das cobranças"><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>← Anterior</button><div>{paginationPages.map((pageNumber) => <button type="button" key={pageNumber} className={currentPage === pageNumber ? 'active' : ''} aria-current={currentPage === pageNumber ? 'page' : undefined} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}</div><span>Página {currentPage} de {totalPages}</span><button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Próxima →</button></nav>
          </section>
        </>}

        {loading && data && <p className="finance-refreshing">Atualizando valores…</p>}
        {message && <p className="finance-feedback success" role="status">{message}</p>}
        {error && <p className="finance-feedback error" role="alert">{error}</p>}
      </section>
    </main>
  )
}
