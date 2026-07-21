import { useState } from 'react'

const commonReasons = [
  'Pausa nos treinos',
  'Questões financeiras',
  'Mudou de profissional',
  'Sem retorno do aluno',
]

export default function StudentDeactivationModal({ student, saving, error, onConfirm, onClose }) {
  const [reason, setReason] = useState('')

  function submit(event) {
    event.preventDefault()
    if (reason.trim().length >= 3) onConfirm(reason.trim())
  }

  return <div className="student-deactivation-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}><section className="student-deactivation-modal" role="alertdialog" aria-modal="true" aria-labelledby="deactivation-title">
    <header><div className="deactivation-icon" aria-hidden="true">○</div><div><p className="eyebrow">INATIVAR ALUNO</p><h2 id="deactivation-title">Por que {student.nome} será inativado?</h2></div><button type="button" disabled={saving} onClick={onClose} aria-label="Fechar">×</button></header>
    <p>O cadastro e todo o histórico serão preservados. Este motivo ficará visível apenas na gestão do Personal.</p>
    <form onSubmit={submit}>
      <div className="deactivation-reasons" aria-label="Motivos rápidos">
        {commonReasons.map((item) => <button type="button" key={item} className={reason === item ? 'selected' : ''} onClick={() => setReason(item)}>{item}</button>)}
      </div>
      <label>Motivo da inativação<textarea autoFocus required minLength="3" maxLength="500" rows="4" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Selecione uma opção ou descreva o motivo…" /><small>{reason.length}/500 caracteres</small></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="deactivation-actions"><button type="button" className="secondary-button" disabled={saving} onClick={onClose}>Cancelar</button><button type="submit" disabled={saving || reason.trim().length < 3}>{saving ? 'Inativando…' : 'Confirmar inativação'}</button></div>
    </form>
  </section></div>
}
