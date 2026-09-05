import { S, COLORS } from "../lib/styles";
import { Card } from "./ui";

// STUB — full Son stats + Mapa (SleepMapSec) are not wired up yet (plan step 9).
export function SonFullScreen({ onClose }) {
  return (
    <div style={S.fullScreen}>
      <div style={S.fullScreenHeader}>
        <button style={S.backArrow} onClick={onClose}>←</button>
        <div style={S.fullScreenTitle}>Son</div>
        <div style={{ width: 19 }} />
      </div>
      <div style={{ padding: 16 }}>
        <Card>
          <div style={{ fontSize: 13, color: COLORS.textSec }}>Estadístiques i mapa de son — properament.</div>
        </Card>
      </div>
    </div>
  );
}
