import { useCallback, useEffect, useState } from 'react'
import { createContract, createStudentNote, getStudentHistory, markInstallmentPaid } from '../../lib/api'
import BackButton from '../../components/navigation/BackButton'

const money = (value = 0) => (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const today = () => new Date().toISOString().slice(0, 10)

export default function StudentHistoryPage({ token, onLogout, studentId }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')
  const [form, setForm] = useState({ titulo: 'Consultoria 2 meses', valor: '', parcelas: 1, metodo_pagamento: 'pix', treinos_inclusos: 2, avaliacoes_inclusas: 1, consultorias_inclusas: 1, inicio_em: today() })

  const load = useCallback(async () => {
    try { setError(''); setData(await getStudentHistory(token, studentId)) }
    catch (requestError) { setError(requestError.message) }
  }, [token, studentId])
  useEffect(() => { load() }, [load])

  async function savePlan(event) {
    event.preventDefault()
    const amount = Number(form.valor.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) return setError('Informe um valor válido para o plano.')
    try {
      setSaving(true); setError('')
      await createContract(token, studentId, { ...form, valor_centavos: Math.round(amount * 100) })
      setForm((current) => ({ ...current, valor: '' })); await load()
    } catch (requestError) { setError(requestError.message) }
    finally { setSaving(false) }
  }

  if (error && !data) return <main className="dashboard-page"><header className="dashboard-header"><div className="header-side"><BackButton fallback="/personal/alunos" /><strong>fit<span>academia</span></strong></div></header><section className="registration-content"><p className="form-error">{error}</p><button onClick={load}>Tentar novamente</button></section></main>
  if (!data) return <main className="dashboard-page"><section className="registration-content"><p>Carregando histórico…</p></section></main>

  const installments = data.contracts.flatMap((contract) => contract.installments.map((installment) => ({ ...installment, contract })))
  const nextAppointment = data.appointments.filter((appointment) => appointment.status === 'agendado' && new Date(appointment.inicio) >= new Date()).sort((a, b) => new Date(a.inicio) - new Date(b.inicio))[0]
  return <main className="dashboard-page registration-page">
    <header className="dashboard-header"><div className="header-side"><BackButton fallback="/personal/alunos" /><strong>fit<span>academia</span></strong></div><button onClick={onLogout}>Sair</button></header>
    <section className="registration-content history-page">
      <p className="eyebrow">HISTÓRICO DO ALUNO</p><h1>{data.student.nome}</h1><p>Atendimentos, plano fechado e pagamentos em um só lugar.</p>
      {nextAppointment ? <div className="appointment-summary"><span>PRÓXIMO AGENDAMENTO</span><strong>{nextAppointment.type?.nome} · {new Date(nextAppointment.inicio).toLocaleDateString('pt-BR')} às {new Date(nextAppointment.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong></div> : <div className="appointment-summary empty"><span>AGENDA</span><strong>Nenhum próximo agendamento.</strong></div>}
      {error && <p className="form-error">{error}</p>}
      <div className="history-grid">
        <section className="history-card"><h2>Novo plano</h2><form onSubmit={savePlan}>
          <label>Plano<input required value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} /></label>
          <div className="form-grid"><label>Valor total<input required inputMode="decimal" placeholder="0,00" value={form.valor} onChange={(event) => setForm({ ...form, valor: event.target.value })} /></label><label>Parcelas<select value={form.parcelas} onChange={(event) => setForm({ ...form, parcelas: Number(event.target.value) })}>{[1, 2, 3, 4, 6, 12].map((number) => <option key={number} value={number}>{number}x</option>)}</select></label><label>Pagamento<select value={form.metodo_pagamento} onChange={(event) => setForm({ ...form, metodo_pagamento: event.target.value })}><option value="pix">Pix</option><option value="cartao">Cartão</option><option value="dinheiro">Dinheiro</option></select></label><label>Primeiro vencimento<input type="date" value={form.inicio_em} onChange={(event) => setForm({ ...form, inicio_em: event.target.value })} /></label></div>
          <div className="form-grid"><label>Treinos<input type="number" min="0" value={form.treinos_inclusos} onChange={(event) => setForm({ ...form, treinos_inclusos: Number(event.target.value) })} /></label><label>Avaliações<input type="number" min="0" value={form.avaliacoes_inclusas} onChange={(event) => setForm({ ...form, avaliacoes_inclusas: Number(event.target.value) })} /></label></div>
          <button disabled={saving}>{saving ? 'Salvando…' : 'Salvar plano'}</button>
        </form></section>
        <section className="history-card"><h2>Pagamentos</h2>{installments.length === 0 && <p>Nenhuma parcela cadastrada.</p>}{installments.map((item) => <article className="payment-row" key={item.id}><div><strong>{item.contract.titulo} · {item.numero}ª parcela</strong><span>Vence {new Date(`${item.vencimento_em}T12:00`).toLocaleDateString('pt-BR')} · {item.metodo_pagamento}</span></div><b>{money(item.valor_centavos)}</b>{item.pago_em ? <em>Pago em {new Date(item.pago_em).toLocaleDateString('pt-BR')}</em> : <button onClick={async () => { try { await markInstallmentPaid(token, item.id); await load() } catch (requestError) { setError(requestError.message) } }}>Já pagou</button>}</article>)}</section>
      </div>
      <section className="history-card"><h2>Observações e atendimentos</h2><form className="note-form" onSubmit={async (event) => { event.preventDefault(); if (!note.trim()) return; try { await createStudentNote(token, studentId, note.trim()); setNote(''); await load() } catch (requestError) { setError(requestError.message) } }}><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Adicionar observação rápida" /><button>Adicionar</button></form>{data.notes.map((item) => <p className="timeline-note" key={item.id}>{item.conteudo}</p>)}{data.appointments.map((item) => <p className="timeline-note" key={`appointment-${item.id}`}><strong>{item.type?.nome}</strong> · {new Date(item.inicio).toLocaleDateString('pt-BR')} {item.observacao && `— ${item.observacao}`}</p>)}</section>
    </section>
  </main>
}
