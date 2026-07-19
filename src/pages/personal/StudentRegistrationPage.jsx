import { useEffect, useState } from 'react'
import { createStudent } from '../../lib/api'
import BackButton from '../../components/navigation/BackButton'
import AcademyPickerModal from '../../components/academies/AcademyPickerModal'

const emptyAddress = { cep: '', estado: '', cidade: '', bairro: '', rua: '', numero: '', complemento: '', referencia: '' }

export default function StudentRegistrationPage({ token, user, onLogout }) {
  const [studentType, setStudentType] = useState(null)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', endereco: emptyAddress })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loadingCep, setLoadingCep] = useState(false)
  const [academy, setAcademy] = useState(null)
  const [showAcademies, setShowAcademies] = useState(false)

  function updateAddress(field, value) { setForm((current) => ({ ...current, endereco: { ...current.endereco, [field]: value } })) }

  useEffect(() => {
    const cep = form.endereco.cep
    if (cep.length !== 8) return

    let cancelled = false
    async function searchCep() {
    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!cancelled && !data.erro) setForm((current) => ({ ...current, endereco: { ...current.endereco, cep, estado: data.uf || '', cidade: data.localidade || '', bairro: data.bairro || '', rua: data.logradouro || '', complemento: data.complemento || current.endereco.complemento } }))
    } catch { /* endereço continua editável mesmo offline */ } finally { if (!cancelled) setLoadingCep(false) }
    }
    searchCep()
    return () => { cancelled = true }
  }, [form.endereco.cep])

  function changeCep(value) {
    updateAddress('cep', value.replace(/\D/g, '').slice(0, 8))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage(''); setError('')
    try {
      await createStudent(token, { nome: form.nome, email: form.email || null, usuario_tipo_id: studentType.id, academia_id: academy?.id || null, telefone: { numero: form.telefone, tipo: 'whatsapp' }, endereco: form.endereco })
      setMessage('Aluno cadastrado com sucesso.')
      setForm({ nome: '', email: '', telefone: '', endereco: emptyAddress })
      setAcademy(null)
    } catch (requestError) { setError(requestError.message) }
  }

  return <main className="dashboard-page registration-page">
    <header className="dashboard-header"><div className="header-side"><BackButton fallback="/personal" /><strong>fit<span>academia</span></strong></div><button onClick={onLogout}>Sair</button></header>
    <section className="registration-content">
      <p className="eyebrow">PERSONAL · {(user?.name || 'USUÁRIO').toUpperCase()}</p>
      <h1>Novo aluno</h1><p>Cadastre os dados básicos. O endereço pode ser preenchido pelo CEP ou manualmente.</p>
      {!studentType && <div className="student-type-choice"><h2>Qual é o tipo de aluno?</h2><p>Selecione uma opção para iniciar o cadastro.</p><div className="type-buttons"><button type="button" onClick={() => setStudentType({ id: 4, label: 'Aluno recorrente' })}><strong>Aluno recorrente</strong><span>Possui rotina contínua na academia.</span></button><button type="button" onClick={() => setStudentType({ id: 5, label: 'Aluno avulso' })}><strong>Aluno avulso</strong><span>Atendimento ou acesso pontual.</span></button></div></div>}
      {studentType && <>
      <form className="student-form" onSubmit={handleSubmit}>
        <div className="selected-type"><span>{studentType.label}</span><button type="button" onClick={() => setStudentType(null)}>Alterar tipo</button></div>
        <h2>Dados do aluno</h2>
        <div className="form-grid"><Field label="Nome completo" value={form.nome} onChange={(value) => setForm({ ...form, nome: value })} required /><Field label="E-mail" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /><Field label="Número do WhatsApp" type="tel" value={form.telefone} onChange={(value) => setForm({ ...form, telefone: value })} required /></div>
        <h2>Endereço</h2>
        <div className="form-grid"><Field label="CEP" value={form.endereco.cep} onChange={changeCep} hint={loadingCep ? 'Buscando endereço...' : 'Digite o CEP para preencher automaticamente'} /><Field label="Estado" value={form.endereco.estado} onChange={(value) => updateAddress('estado', value.toUpperCase())} /><Field label="Cidade" value={form.endereco.cidade} onChange={(value) => updateAddress('cidade', value)} /><Field label="Bairro" value={form.endereco.bairro} onChange={(value) => updateAddress('bairro', value)} /><Field label="Rua" value={form.endereco.rua} onChange={(value) => updateAddress('rua', value)} /><Field label="Número" value={form.endereco.numero} onChange={(value) => updateAddress('numero', value)} /><Field label="Complemento" value={form.endereco.complemento} onChange={(value) => updateAddress('complemento', value)} /><Field label="Referência" value={form.endereco.referencia} onChange={(value) => updateAddress('referencia', value)} /></div>
        <h2>Academia principal</h2>
        <p className="form-section-copy">Vincule a academia para o aluno aparecer no mapa. Você também pode deixar sem academia para atendimentos domiciliares.</p>
        <button type="button" className="academy-picker-trigger" onClick={() => setShowAcademies(true)}><span aria-hidden="true">⌖</span><span><small>SELECIONAR NO MAPA</small><strong>{academy?.nome || 'Escolher academia'}</strong></span><b>›</b></button>
        {academy && <button type="button" className="remove-academy" onClick={() => setAcademy(null)}>Remover vínculo com {academy.nome}</button>}
        {message && <p className="form-success">{message}</p>}{error && <p className="form-error">{error}</p>}<button type="submit">Salvar aluno</button>
      </form>
      {showAcademies && <AcademyPickerModal token={token} selectedId={academy?.id} onSelect={setAcademy} onClose={() => setShowAcademies(false)} />}
      </>}
    </section>
  </main>
}

function Field({ label, type = 'text', value, onChange, hint, required }) { return <label>{label}<input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} />{hint && <small>{hint}</small>}</label> }
