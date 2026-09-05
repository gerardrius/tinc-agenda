import { COLORS } from "../lib/styles";
import { Card, Title } from "./ui";

// STUB — Son/Finances entry cards, objectius, tendències and match history
// are not built yet (plan step 11, rebuilding from HistoryView.jsx).
export function JoView() {
  return (
    <div>
      <Title>Jo</Title>
      <Card>
        <div style={{ fontSize: 13, color: COLORS.textSec }}>
          Tendències, objectius i historial de partits es construeixen més endavant.
        </div>
      </Card>
    </div>
  );
}
