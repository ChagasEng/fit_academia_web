export default function StudentTypeBadge({ type }) {
  if (!type) return null

  const color = type.slug === 'aluno_avulso' ? 'avulso' : type.slug === 'aluno_recorrente' ? 'recorrente' : ''
  return <span className={`student-type-badge ${color}`}>{type.nome}</span>
}
