import { useState } from 'react'
import { createStudent } from '../../lib/api'

const emptyAddress = { cep: '', estado: '', cidade: '', bairro: '', rua: '', numero: '', complemento: '', referencia: '' }

export default function StudentRegistrationPage({ token, user, onLogout }) {
  const [form, setForm] = useState({ nome: '', email: '', usuario_tipo_id: '4', telefone: '', endereco: emptyAddress })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loadingCep, setLoadingCep] = useState(false)

  function updateAddress(field, value) { setForm((current) => ({ ...current, endereco: { ...current.endereco, [field]: value } })) }

  async function searchCep() {
    const cep = form.endereco.cep.replace(/\D/g, '')
    updateAddress('cep', cep)
    if (cep.length !== 8) return
    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!data.erro) setForm((current) => ({ ...current, endereco: { ...current.endereco, cep, estado: data.uf || '', cidade: data.localidade || '', bairro: data.bairro || '', rua: data.logradouro || '', complemento: data.complemento || current.endereco.complemento } }))
    } catch { /* endereço continua editável mesmo offline */ } finally { setLoadingCep(false) }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage(''); setError('')
    try {
      await createStudent(token, { nome: form.nome, email: form.email || null, usuario_tipo_id: Number(form.usuario_tipo_id), telefone: { numero: form.telefone, tipo: 'whatsapp' }, endereco: form.endereco })
      setMessage('Aluno cadastrado com sucesso.')
      setForm({ nome: '', email: '', usuario_tipo_id: '4', telefone: '', endereco: emptyAddress })
    } catch (requestError) { setError(requestError.message) }
  }

  return <main className="dashboard-page registration-page">
    <header className="dashboard-header"><strong>fit<span>academia</span></strong><button onClick={onLogout}>Sair</button></header>
    <section className="registration-content">
      <p className="eyebrow">PERSONAL · {user.name.toUpperCase()}</p>
      <h1>Novo aluno</h1><p>Cadastre os dados básicos. O endereço pode ser preenchido pelo CEP ou manualmente.</p>
      <form className="student-form" onSubmit={handleSubmit}>
        <h2>Dados do aluno</h2>
        <div className="form-grid"><Field label="Nome completo" value={form.nome} onChange={(value) => setForm({ ...form, nome: value })} required /><Field label="E-mail" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /><Field label="Telefone" value={form.telefone} onChange={(value) => setForm({ ...form, telefone: value })} required /><label>Tipo de aluno<select value={form.usuario_tipo_id} onChange={(event) => setForm({ ...form, usuario_tipo_id: event.target.value })}><option value="4">Aluno recorrente</option><option value="5">Aluno avulso</option></select></label></div>
        <h2>Endereço</h2>
        <div className="form-grid"><Field label="CEP" value={form.endereco.cep} onChange={(value) => updateAddress('cep', value)} onBlur={searchCep} hint={loadingCep ? 'Consultando CEP...' : 'Preencha ou informe manualmente'} /><Field label="Estado" value={form.endereco.estado} onChange={(value) => updateAddress('estado', value.toUpperCase())} /><Field label="Cidade" value={form.endereco.cidade} onChange={(value) => updateAddress('cidade', value)} /><Field label="Bairro" value={form.endereco.bairro} onChange={(value) => updateAddress('bairro', value)} /><Field label="Rua" value={form.endereco.rua} onChange={(value) => updateAddress('rua', value)} /><Field label="Número" value={form.endereco.numero} onChange={(value) => updateAddress('numero', value)} /><Field label="Complemento" value={form.endereco.complemento} onChange={(value) => updateAddress('complemento', value)} /><Field label="Referência" value={form.endereco.referencia} onChange={(value) => updateAddress('referencia', value)} /></div>
        {message && <p className="form-success">{message}</p>}{error && <p className="form-error">{error}</p>}<button type="submit">Salvar aluno</button>
      </form>
    </section>
  </main>
}

function Field({ label, type = 'text', value, onChange, onBlur, hint, required }) { return <label>{label}<input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} />{hint && <small>{hint}</small>}</label> }
