import { S, COLORS } from "../lib/styles";
import { Card } from "./ui";

// STUB — Resum/Despeses/Estalvi with sample data are not built yet (plan step 10).
export function FinancesFullScreen({ onClose }) {
  return (
    <div style={S.fullScreen}>
      <div style={S.fullScreenHeader}>
        <button style={S.backArrow} onClick={onClose}>←</button>
        <div style={S.fullScreenTitle}>Finances</div>
        <div style={{ width: 19 }} />
      </div>
      <div style={{ padding: 16 }}>
        <Card>
          <div style={{ fontSize: 13, color: COLORS.textSec }}>Resum, despeses i estalvi — properament.</div>
        </Card>
      </div>
    </div>
  );
}
