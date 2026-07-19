import StudentTypeBadge from './StudentTypeBadge'

export default function StudentDetailsSheet({ student, onClose }) {
  const address = student.addresses?.[0]
  const phone = student.phones?.[0]
  const destination = address && [address.rua, address.numero, address.bairro, address.cidade, address.estado, address.cep].filter(Boolean).join(', ')

  function openRoute(provider) {
    const query = encodeURIComponent(destination)
    const url = provider === 'waze' ? `https://www.waze.com/ul?q=${query}&navigate=yes` : `https://www.google.com/maps/dir/?api=1&destination=${query}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  function openHistory() { window.history.pushState({}, '', `/personal/alunos/${student.id}/historico`); window.dispatchEvent(new PopStateEvent('popstate')) }

  return <section className="student-sheet" role="dialog" aria-modal="true" aria-label="Dados do aluno"><div className="day-sheet-header"><div><p className="eyebrow">CADASTRO DO ALUNO</p><h2>{student.nome}</h2></div><button onClick={onClose} aria-label="Fechar dados">×</button></div><dl className="student-details"><div><dt>Tipo</dt><dd><StudentTypeBadge type={student.type} /></dd></div><div><dt>E-mail</dt><dd>{student.email || 'Não informado'}</dd></div><div><dt>Telefone</dt><dd>{phone?.numero || 'Não informado'}</dd></div><div><dt>CEP</dt><dd>{address?.cep || 'Não informado'}</dd></div><div className="full"><dt>Endereço</dt><dd>{destination || 'Não informado'}</dd></div><div className="full"><dt>Complemento / referência</dt><dd>{[address?.complemento, address?.referencia].filter(Boolean).join(' · ') || 'Não informado'}</dd></div></dl><div className="route-actions"><button onClick={openHistory}>Ver histórico e pagamentos</button>{destination && <><button onClick={() => openRoute('maps')}>Ir com Google Maps</button><button onClick={() => openRoute('waze')}>Ir com Waze</button></>}</div></section>
}
