import { S, COLORS } from "../lib/styles";
import { Card, Title, Sheet, SheetCloseBtn } from "./ui";
import { DOMAINS } from "../lib/constants";

// STUB — balance wheel + smart nudges + weekly log cards + domain sheet are
// not built yet (plan step 8). This keeps the tab navigable in the meantime.
export function SetmanaView() {
  return (
    <div>
      <Title>Setmana</Title>
      <Card>
        <div style={{ fontSize: 13, color: COLORS.textSec }}>
          La roda d'equilibri, els avisos intel·ligents i el registre setmanal es construeixen al següent pas.
        </div>
      </Card>
    </div>
  );
}

// Shared domain bottom sheet, opened from the domain strip on any tab.
export function DomainSheet({ domain, onClose }) {
  if (!domain) return null;
  const d = DOMAINS.find((x) => x.id === domain);
  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 19, fontWeight: 600 }}>{d?.emoji} {d?.label}</div>
        <SheetCloseBtn onClose={onClose} />
      </div>
      <div style={{ fontSize: 13, color: COLORS.textSec }}>Detall del domini — properament.</div>
    </Sheet>
  );
}
