import { S, COLORS } from "../lib/styles";

// STUB — 5-step weekly ritual (incl. intention keyword-parsing) is not built
// yet (plan step 12).
export function RitualSetmanal({ onClose }) {
  return (
    <div style={S.ritualShell}>
      <div style={S.ritualHeader}>
        <button style={S.backArrow} onClick={onClose}>←</button>
        <div />
        <button style={S.backArrow} onClick={onClose}>✕</button>
      </div>
      <div style={S.ritualBody}>
        <div style={S.ritualEyebrow}>Revisió setmanal</div>
        <div style={S.ritualStepTitle}>Properament</div>
        <div style={S.ritualStepSubtitle}>El flux de 5 passos es construeix més endavant.</div>
      </div>
      <div style={S.ritualFooter}>
        <button style={{ ...S.ritualBtn, background: COLORS.ritualSet }} onClick={onClose}>Tancar</button>
      </div>
    </div>
  );
}
