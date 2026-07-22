import { useEffect, useMemo, useState } from 'react'
import { createContract, getStudents } from '../../lib/api'
import { currencyToCents, formatCurrency } from '../../lib/masks'

const installmentOptions = [1, 2, 3, 4, 6, 12]
const methods = [['pix', 'Pix'], ['cartao', 'Cartão'], ['dinheiro', 'Dinheiro']]

function localDate(offsetDays = 0) {
  const value = new Date()
  value.setDate(value.getDate() + offsetDays)
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'AL'
const money = (cents = 0) => (Number(cents) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ChargeCreateSheet({ token, fixedStudent = null, defaultDueDate = '', onClose, onSaved }) {
  const [student, setStudent] = useState(fixedStudent)
  const [search, setSearch] = useState('')
  const [students, setStudents] = useState([])
  const [searching, setSearching] = useState(!fixedStudent)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    titulo: 'Mensalidade',
    valor: '',
    parcelas: 1,
    metodo_pagamento: 'pix',
    inicio_em: defaultDueDate || localDate(),
    treinos_inclusos: 0,
    avaliacoes_inclusas: 0,
    consultorias_inclusas: 0,
  })

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => { if (event.key === 'Escape' && !saving) onClose() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose, saving])

  useEffect(() => {
    if (fixedStudent || student) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setSearching(true)
      getStudents(token, 1, search.trim(), '', '1', controller.signal)
        .then((response) => setStudents(response.students?.data || []))
        .catch((requestError) => { if (requestError.name !== 'AbortError') setError(requestError.message) })
        .finally(() => { if (!controller.signal.aborted) setSearching(false) })
    }, search.trim() ? 250 : 0)
    return () => { clearTimeout(timer); controller.abort() }
  }, [fixedStudent, search, student, token])

  const amountInCents = currencyToCents(form.valor)
  const installmentValue = useMemo(
    () => form.parcelas > 0 ? Math.round(amountInCents / form.parcelas) : 0,
    [amountInCents, form.parcelas],
  )

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    if (!student) return setError('Selecione o aluno que receberá a cobrança.')
    if (!amountInCents) return setError('Informe um valor válido para a cobrança.')
    if (!form.inicio_em) return setError('Informe a data do primeiro vencimento.')
    try {
      setSaving(true)
      setError('')
      const contract = await createContract(token, student.id, { ...form, valor_centavos: amountInCents })
      onSaved({ contract, student, dueDate: form.inicio_em, installments: form.parcelas })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return <div className="charge-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}>
    <section className="charge-sheet" role="dialog" aria-modal="true" aria-labelledby="charge-title">
      <span className="charge-handle" aria-hidden="true" />
      <header>
        <div><p className="eyebrow">NOVO LANÇAMENTO</p><h2 id="charge-title">Nova cobrança</h2><span>Preencha o essencial. O lançamento já aparecerá no faturamento.</span></div>
        <button type="button" className="charge-close" onClick={onClose} disabled={saving} aria-label="Fechar">×</button>
      </header>

      <form className="charge-form" onSubmit={submit}>
        <div className="charge-section">
          <span className="charge-step">1</span>
          <div className="charge-section-content">
            <strong>Quem vai pagar?</strong>
            {student ? <div className="charge-selected-student">
              <span className="finance-student-avatar" aria-hidden="true">{initials(student.nome || student.name)}</span>
              <span><strong>{student.nome || student.name}</strong><small>{student.email || 'Sem e-mail cadastrado'}</small></span>
              {!fixedStudent && <button type="button" onClick={() => { setStudent(null); setSearch('') }}>Trocar</button>}
            </div> : <div className="charge-student-picker">
              <input autoFocus type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Digite o nome do aluno" aria-label="Buscar aluno" />
              <div className="charge-student-results">
                {students.map((item) => <button type="button" key={item.id} onClick={() => setStudent(item)}>
                  <span className="finance-student-avatar" aria-hidden="true">{initials(item.nome)}</span>
                  <span><strong>{item.nome}</strong><small>{item.email || item.phones?.[0]?.numero || 'Aluno ativo'}</small></span>
                  <b aria-hidden="true">›</b>
                </button>)}
                {searching && <p>Buscando alunos…</p>}
                {!searching && students.length === 0 && <p>Nenhum aluno ativo encontrado.</p>}
              </div>
            </div>}
          </div>
        </div>

        <div className="charge-section">
          <span className="charge-step">2</span>
          <div className="charge-section-content">
            <strong>Qual é a cobrança?</strong>
            <div className="charge-main-fields">
              <label>Descrição<input required value={form.titulo} onChange={(event) => update('titulo', event.target.value)} placeholder="Ex.: Mensalidade de agosto" /></label>
              <label>Valor total<input required inputMode="decimal" value={form.valor} onChange={(event) => update('valor', formatCurrency(event.target.value))} placeholder="R$ 0,00" /></label>
            </div>
            <fieldset className="charge-choice"><legend>Parcelas</legend><div>{installmentOptions.map((number) => <button type="button" className={form.parcelas === number ? 'active' : ''} key={number} onClick={() => update('parcelas', number)}>{number}x</button>)}</div></fieldset>
            {amountInCents > 0 && <div className="charge-preview"><span>{form.parcelas === 1 ? 'COBRANÇA ÚNICA' : `${form.parcelas} PARCELAS DE APROXIMADAMENTE`}</span><strong>{money(installmentValue)}</strong></div>}
          </div>
        </div>

        <div className="charge-section">
          <span className="charge-step">3</span>
          <div className="charge-section-content">
            <strong>Quando e como?</strong>
            <label className="charge-due-date">Primeiro vencimento<input type="date" required value={form.inicio_em} onChange={(event) => update('inicio_em', event.target.value)} /></label>
            <div className="charge-date-shortcuts"><button type="button" onClick={() => update('inicio_em', localDate())}>Hoje</button><button type="button" onClick={() => update('inicio_em', localDate(7))}>Em 7 dias</button><button type="button" onClick={() => update('inicio_em', localDate(30))}>Em 30 dias</button></div>
            <fieldset className="charge-choice"><legend>Forma prevista</legend><div>{methods.map(([value, label]) => <button type="button" className={form.metodo_pagamento === value ? 'active' : ''} key={value} onClick={() => update('metodo_pagamento', value)}>{label}</button>)}</div></fieldset>
          </div>
        </div>

        <details className="charge-optional">
          <summary>Detalhes opcionais do plano</summary>
          <p>Use somente se quiser controlar os serviços incluídos nesta cobrança.</p>
          <div><label>Treinos<input type="number" min="0" value={form.treinos_inclusos} onChange={(event) => update('treinos_inclusos', Number(event.target.value))} /></label><label>Avaliações<input type="number" min="0" value={form.avaliacoes_inclusas} onChange={(event) => update('avaliacoes_inclusas', Number(event.target.value))} /></label><label>Consultorias<input type="number" min="0" value={form.consultorias_inclusas} onChange={(event) => update('consultorias_inclusas', Number(event.target.value))} /></label></div>
        </details>

        {error && <p className="charge-error" role="alert">{error}</p>}
        <div className="charge-actions"><button type="button" onClick={onClose} disabled={saving}>Cancelar</button><button type="submit" disabled={saving || !student || !amountInCents}>{saving ? 'Lançando cobrança…' : 'Lançar cobrança'}</button></div>
      </form>
    </section>
  </div>
}
