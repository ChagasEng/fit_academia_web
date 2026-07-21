import StudentTypeBadge from '../../components/students/StudentTypeBadge'

function formatTime(value) {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function AppointmentActionsSheet({ appointment, hasRoute, deleting, onClose, onReschedule, onViewStudent, onOpenRoute, onDelete }) {
  const start = new Date(appointment.inicio)

  return <div className="appointment-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="appointment-actions-sheet" role="dialog" aria-modal="true" aria-labelledby="appointment-actions-title">
      <div className="sheet-handle" aria-hidden="true" />
      <header>
        <div><p className="eyebrow">AGENDAMENTO</p><h2 id="appointment-actions-title">{appointment.student?.nome || 'Atendimento'}</h2></div>
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Fechar detalhes">×</button>
      </header>

      <div className="appointment-hero">
        <div className="appointment-date-badge"><span>{start.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span><strong>{start.getDate()}</strong><small>{start.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</small></div>
        <div><span>HORÁRIO</span><strong>{formatTime(appointment.inicio)} — {formatTime(appointment.fim)}</strong><small>{appointment.type?.nome || appointment.titulo}</small></div>
        <StudentTypeBadge type={appointment.student?.type} />
      </div>

      <dl className="appointment-action-details">
        <div><dt>Atendimento</dt><dd>{appointment.titulo}</dd></div>
        <div><dt>Local</dt><dd>{appointment.local_tipo === 'domicilio' ? 'Domicílio do aluno' : (appointment.academia_nome || appointment.academy?.nome || 'Academia')}</dd></div>
      </dl>

      <div className="appointment-primary-actions">
        <button type="button" className="appointment-action-main" onClick={onReschedule}><span aria-hidden="true">↻</span><span><strong>Reagendar</strong><small>Alterar data e horário</small></span><b aria-hidden="true">›</b></button>
        {appointment.student?.id && <button type="button" className="appointment-action-card" onClick={onViewStudent}><span aria-hidden="true">◉</span><span><strong>Ver aluno</strong><small>Perfil e histórico</small></span><b aria-hidden="true">›</b></button>}
      </div>

      {hasRoute && <div className="appointment-route-block"><span>COMO CHEGAR</span><div><button type="button" onClick={() => onOpenRoute('maps')}>Google Maps</button><button type="button" onClick={() => onOpenRoute('waze')}>Waze</button></div></div>}

      <button type="button" className="appointment-delete-wide" disabled={deleting} onClick={onDelete}>{deleting ? 'Excluindo agendamento…' : 'Excluir agendamento'}</button>
    </section>
  </div>
}
