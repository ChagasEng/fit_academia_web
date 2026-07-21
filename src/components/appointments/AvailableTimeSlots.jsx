export default function AvailableTimeSlots({ slots, value, onChange, loading, workingHours, durationMinutes = 60, dateLabel = '' }) {
  return (
    <section className="available-times" aria-busy={loading}>
      <div className="available-times-heading">
        <div><span>HORÁRIOS LIVRES</span><strong>{workingHours ? `${workingHours.inicio} às ${workingHours.fim}` : 'Consultando agenda'}</strong></div>
        <small>{dateLabel ? `${dateLabel} · ` : ''}Duração de {durationMinutes >= 60 ? `${durationMinutes / 60}h` : `${durationMinutes} min`}</small>
      </div>
      {loading && <div className="available-times-loading"><i /><i /><i /><i /></div>}
      {!loading && slots.length > 0 && <div className="available-times-grid" role="radiogroup" aria-label="Escolha um horário livre">
        {slots.map((slot) => <button key={slot.inicio} type="button" role="radio" aria-checked={value === slot.inicio} className={value === slot.inicio ? 'selected' : ''} onClick={() => onChange(slot.inicio)}><strong>{slot.inicio}</strong><span>até {slot.fim}</span></button>)}
      </div>}
      {!loading && slots.length === 0 && <div className="available-times-empty"><span aria-hidden="true">◷</span><div><strong>Agenda cheia neste dia</strong><small>Escolha outra data para encontrar horários livres.</small></div></div>}
    </section>
  )
}
