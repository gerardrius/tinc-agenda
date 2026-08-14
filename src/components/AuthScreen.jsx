import { useState } from "react";
import { S } from "../lib/styles";
import { signInWithMagicLink } from "../lib/remoteStorage";

export function AuthScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const send = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSending(true); setError("");
    const { error: err } = await signInWithMagicLink(email);
    setSending(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  return (
    <div style={{ ...S.app, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 320 }}>
        <div style={{ ...S.logo, textAlign: "center", marginBottom: 4 }}>Tinc Agenda</div>
        <div style={{ ...S.dateLabel, textAlign: "center", marginBottom: 24 }}>Inicia sessió per sincronitzar entre dispositius</div>

        {sent ? (
          <div style={S.card}>
            <p style={{ fontSize: 12, color: "#a7f3d0", margin: 0 }}>✓ T'hem enviat un enllaç màgic a <strong>{email}</strong>. Obre'l per entrar.</p>
          </div>
        ) : (
          <form onSubmit={send}>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="el.teu@email.com"
              style={{ ...S.inp, marginBottom: 10 }}
            />
            <button type="submit" disabled={sending} style={{ ...S.pBtn, width: "100%", marginBottom: 0, opacity: sending ? 0.6 : 1 }}>
              {sending ? "Enviant..." : "Envia'm l'enllaç màgic"}
            </button>
            {error && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 10 }}>{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
