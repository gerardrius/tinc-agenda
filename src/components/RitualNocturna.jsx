import { S, COLORS } from "../lib/styles";

// STUB — 5-step nightly ritual is not built yet (plan step 12).
export function RitualNocturna({ onClose }) {
  return (
    <div style={S.ritualShell}>
      <div style={S.ritualHeader}>
        <button style={S.backArrow} onClick={onClose}>←</button>
        <div />
        <button style={S.backArrow} onClick={onClose}>✕</button>
      </div>
      <div style={S.ritualBody}>
        <div style={S.ritualEyebrow}>Revisió nocturna</div>
        <div style={S.ritualStepTitle}>Properament</div>
        <div style={S.ritualStepSubtitle}>El flux de 5 passos es construeix més endavant.</div>
      </div>
      <div style={S.ritualFooter}>
        <button style={{ ...S.ritualBtn, background: COLORS.ritualNit }} onClick={onClose}>Tancar</button>
      </div>
    </div>
  );
}
