import { useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useStore, formatCOP, appointmentDebt, type MovementSource, type Appointment } from "../lib/store";
import { Field } from "../components/Field";
import type { Page } from "../App";

export function Deudas({ navigate }: { navigate: (p: Page) => void }) {
  const { appointments } = useStore();
  const [paying, setPaying] = useState<Appointment | null>(null);

  const debts = appointments
    .filter((a) => appointmentDebt(a) > 0 && a.status !== "cancelado")
    .sort((a, b) => a.date.localeCompare(b.date));
  const total = debts.reduce((s, a) => s + appointmentDebt(a), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <button onClick={() => navigate("inicio")}
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
        <ArrowLeft size={16} /> Volver
      </button>
      <h1 className="font-display" style={{ fontSize: "1.875rem" }}>Por cobrar</h1>

      <div style={{ borderRadius: "1rem", background: "linear-gradient(135deg, var(--primary), var(--accent))", padding: "1.25rem", color: "var(--primary-foreground)" }}>
        <div style={{ fontSize: "0.75rem", opacity: 0.9 }}>Total adeudado</div>
        <div className="font-display" style={{ fontSize: "1.875rem", marginTop: 4 }}>{formatCOP(total)}</div>
        <div style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: 4 }}>{debts.length} clientas pendientes</div>
      </div>

      {debts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2.5rem 0", color: "var(--muted-foreground)" }}>¡Sin deudas pendientes! 🎉</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {debts.map((a) => (
            <div key={a.id} style={{ borderRadius: "1rem", background: "var(--card)", border: "1px solid var(--border)", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 500 }}>{a.clientName}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{a.date} · {a.services.map((s) => s.name).join(", ")}</div>
                <div className="font-display" style={{ fontSize: "1.125rem", color: "var(--primary)", marginTop: 4 }}>
                  Saldo: {formatCOP(appointmentDebt(a))}
                </div>
              </div>
              <button onClick={() => setPaying(a)}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "0.5rem 0.875rem", borderRadius: 9999, background: "color-mix(in oklab, var(--success) 15%, transparent)", color: "var(--success)", fontSize: "0.875rem" }}>
                <Check size={16} /> Pagó
              </button>
            </div>
          ))}
        </div>
      )}

      {paying && <PayDebtModal appt={paying} onClose={() => setPaying(null)} />}
    </div>
  );
}

function PayDebtModal({ appt, onClose }: { appt: Appointment; onClose: () => void }) {
  const { updateAppointment, addMovement } = useStore();
  const debt = appointmentDebt(appt);
  const [amount, setAmount] = useState(debt.toString());
  const [source, setSource] = useState<MovementSource>("efectivo");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const submit = () => {
    const amt = Number(amount || 0);
    if (amt <= 0) return toast.error("Monto inválido");
    if (source === "efectivo") {
      updateAppointment(appt.id, { paidCash: (appt.paidCash || 0) + amt });
    } else {
      updateAppointment(appt.id, { paidNequi: (appt.paidNequi || 0) + amt });
    }
    addMovement({
      kind: "ingreso_inversion", category: "Servicio", amount: amt, date,
      comment: `Pago de deuda: ${appt.clientName}`, source,
      appointmentId: appt.id, autoType: "deuda",
    });
    toast.success("Pago registrado en ingresos");
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "end center" }} onClick={onClose}>
      <div style={{ background: "var(--card)", width: "100%", maxWidth: 448, borderRadius: "1.5rem 1.5rem 0 0", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="font-display" style={{ fontSize: "1.5rem" }}>Registrar pago</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          {appt.clientName} · Saldo: <span style={{ color: "var(--primary)", fontWeight: 500 }}>{formatCOP(debt)}</span>
        </div>
        <Field label="Monto"><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" /></Field>
        <Field label="Forma de pago">
          <select value={source} onChange={(e) => setSource(e.target.value as MovementSource)} className="input">
            <option value="efectivo">Efectivo</option>
            <option value="nequi">Nequi</option>
          </select>
        </Field>
        <Field label="Fecha"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" /></Field>
        <button onClick={submit} style={{ width: "100%", padding: "0.75rem", borderRadius: 9999, background: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 500 }}>
          Registrar pago
        </button>
      </div>
    </div>
  );
}
