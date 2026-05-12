import { useMemo, useState } from "react";
import { Plus, X, Pencil, Trash2, TrendingUp, TrendingDown, PiggyBank, Wallet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useStore, formatCOP, type Movement, type MovementKind, type MovementSource } from "../lib/store";
import { Field } from "../components/Field";
import type { Page } from "../App";

const CATEGORIES: Record<MovementKind, string[]> = {
  ingreso_inversion: ["Inversión al negocio", "Otro ingreso"],
  gasto: ["Herramientas", "Insumos", "Reparación y mantenimiento", "Arriendo", "Inmuebles", "Aseo y limpieza", "Empleados", "Otro servicio", "No determinado"],
  inversion: ["Cursos o capacitaciones", "Mejoras de imagen del local", "Compra de inmuebles", "No determinado"],
  retiro: ["Sueldo", "Sueldo de empleado", "Retiro del mes", "Retiro de ganancias", "No determinado"],
};

const KIND_LABELS: Record<MovementKind, string> = {
  ingreso_inversion: "Ingreso", gasto: "Gasto", inversion: "Inversión", retiro: "Retiro",
};

type Period = "dia" | "semana" | "mes";

export function Movimientos({ navigate }: { navigate: (p: Page) => void }) {
  const { movements, deleteMovement } = useStore();
  const [period, setPeriod] = useState<Period>("mes");
  const [filter, setFilter] = useState<MovementKind | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Movement | null>(null);

  const now = new Date();
  const filtered = useMemo(() => {
    return movements.filter((m) => {
      if (filter !== "all" && m.kind !== filter) return false;
      const d = new Date(`${m.date}T00:00:00`);
      if (period === "dia") return d.toDateString() === now.toDateString();
      if (period === "semana") {
        const s = new Date(now); s.setDate(now.getDate() - now.getDay()); return d >= s;
      }
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [movements, period, filter]);

  const totals = useMemo(() => {
    let ing = 0, gas = 0, inv = 0, ret = 0, cash = 0, nequi = 0;
    movements.forEach((m) => {
      const d = new Date(`${m.date}T00:00:00`);
      const inPeriod = period === "dia" ? d.toDateString() === now.toDateString()
        : period === "semana" ? d >= new Date(new Date().setDate(now.getDate() - now.getDay()))
        : d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (inPeriod) {
        if (m.kind === "ingreso_inversion") ing += m.amount;
        else if (m.kind === "gasto") gas += m.amount;
        else if (m.kind === "inversion") inv += m.amount;
        else if (m.kind === "retiro") ret += m.amount;
      }
      const sign = m.kind === "ingreso_inversion" ? 1 : -1;
      if (m.source === "efectivo") cash += sign * m.amount;
      else nequi += sign * m.amount;
    });
    return { ing, gas, inv, ret, cash, nequi };
  }, [movements, period]);

  const chartData = [
    { name: "Ingresos", value: totals.ing, fill: "var(--success)" },
    { name: "Gastos", value: totals.gas, fill: "var(--destructive)" },
    { name: "Inversión", value: totals.inv, fill: "var(--gold)" },
    { name: "Retiros", value: totals.ret, fill: "var(--primary)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 className="font-display" style={{ fontSize: "1.875rem" }}>Finanzas</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "0.5rem 0.875rem", borderRadius: 9999, background: "var(--primary)", color: "var(--primary-foreground)", fontSize: "0.875rem" }}>
          <Plus size={16} /> Movimiento
        </button>
      </div>

      <button onClick={() => navigate("deudas")}
        style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: "1rem", background: "var(--secondary)", padding: "0.75rem", fontSize: "0.875rem", textAlign: "left" }}>
        <AlertCircle size={16} style={{ color: "var(--primary)" }} /> Ver clientas con deuda →
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {[{ label: "Efectivo", value: totals.cash }, { label: "Nequi", value: totals.nequi }].map((s) => (
          <div key={s.label} style={{ borderRadius: "1rem", background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 90%, transparent), var(--accent))", padding: "1rem", color: "var(--primary-foreground)" }}>
            <div style={{ fontSize: "0.75rem", opacity: 0.9 }}>{s.label}</div>
            <div className="font-display" style={{ fontSize: "1.5rem", marginTop: 4 }}>{formatCOP(s.value)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--secondary)", borderRadius: 9999, fontSize: "0.875rem" }}>
        {(["dia", "semana", "mes"] as Period[]).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            style={{ flex: 1, padding: "0.5rem", borderRadius: 9999, textTransform: "capitalize",
              background: period === p ? "var(--card)" : "transparent",
              color: period === p ? "var(--foreground)" : "var(--muted-foreground)",
              boxShadow: period === p ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}>{p}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {[
          { icon: TrendingUp, label: "Ingresos", value: totals.ing, color: "var(--success)" },
          { icon: TrendingDown, label: "Gastos", value: totals.gas, color: "var(--destructive)" },
          { icon: PiggyBank, label: "Inversión", value: totals.inv, color: "var(--gold)" },
          { icon: Wallet, label: "Retiros", value: totals.ret, color: "var(--primary)" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{ borderRadius: "1rem", background: "var(--card)", border: "1px solid var(--border)", padding: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
              <Icon size={16} style={{ color }} /> {label}
            </div>
            <div className="font-display" style={{ fontSize: "1.25rem", marginTop: 4 }}>{formatCOP(value)}</div>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: "1rem", background: "var(--card)", border: "1px solid var(--border)", padding: "1rem" }}>
        <h3 className="font-display" style={{ fontSize: "1.125rem", marginBottom: 8 }}>Resumen del período</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis hide />
            <Tooltip formatter={(v: number) => formatCOP(v)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <rect key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {[{ key: "all", label: "Todos" }, ...Object.entries(KIND_LABELS).map(([k, l]) => ({ key: k, label: l }))].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key as MovementKind | "all")}
            style={{ padding: "6px 12px", borderRadius: 9999, fontSize: "0.75rem", whiteSpace: "nowrap",
              background: filter === key ? "var(--primary)" : "var(--secondary)",
              color: filter === key ? "var(--primary-foreground)" : "var(--secondary-foreground)",
            }}>{label}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--muted-foreground)", padding: "1.5rem 0" }}>Sin movimientos.</p>
        ) : filtered.map((m) => (
          <div key={m.id} style={{ borderRadius: "0.75rem", background: "var(--card)", border: "1px solid var(--border)", padding: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: "0.625rem", padding: "2px 8px", borderRadius: 9999,
                  background: m.kind === "ingreso_inversion" ? "color-mix(in oklab, var(--success) 15%, transparent)"
                    : m.kind === "gasto" ? "color-mix(in oklab, var(--destructive) 15%, transparent)"
                    : m.kind === "inversion" ? "color-mix(in oklab, var(--gold) 20%, transparent)"
                    : "color-mix(in oklab, var(--primary) 15%, transparent)",
                  color: m.kind === "ingreso_inversion" ? "var(--success)" : m.kind === "gasto" ? "var(--destructive)" : m.kind === "inversion" ? "var(--gold)" : "var(--primary)",
                }}>{KIND_LABELS[m.kind]}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{m.category}</span>
              </div>
              <div style={{ fontWeight: 500, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.comment || "—"}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{m.date} · {m.source}</div>
            </div>
            <div style={{ textAlign: "right", marginLeft: 8 }}>
              <div className="font-display" style={{ fontSize: "1.125rem", color: m.kind === "ingreso_inversion" ? "var(--success)" : "var(--foreground)" }}>
                {m.kind === "ingreso_inversion" ? "+" : "-"}{formatCOP(m.amount)}
              </div>
              <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", marginTop: 4 }}>
                {!m.appointmentId && (
                  <button onClick={() => { setEditing(m); setShowForm(true); }} style={{ padding: 4, borderRadius: 4 }}><Pencil size={14} /></button>
                )}
                <button onClick={() => { if (confirm("¿Eliminar movimiento?")) { deleteMovement(m.id); toast.success("Eliminado"); } }}
                  style={{ padding: 4, borderRadius: 4, color: "var(--destructive)" }}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && <MovementForm initial={editing || undefined} onClose={() => { setShowForm(false); setEditing(null); }} />}
    </div>
  );
}

function MovementForm({ initial, onClose }: { initial?: Movement; onClose: () => void }) {
  const { addMovement, updateMovement } = useStore();
  const [kind, setKind] = useState<MovementKind>(initial?.kind || "gasto");
  const [category, setCategory] = useState(initial?.category || CATEGORIES.gasto[0]);
  const [amount, setAmount] = useState(initial?.amount?.toString() || "");
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState(initial?.comment || "");
  const [source, setSource] = useState<MovementSource>(initial?.source || "efectivo");

  const submit = () => {
    if (!amount) return toast.error("Ingresa monto");
    const data = { kind, category, amount: Number(amount), date, comment, source };
    if (initial) { updateMovement(initial.id, data); toast.success("Actualizado"); }
    else { addMovement(data); toast.success("Registrado"); }
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "end center" }} onClick={onClose}>
      <div style={{ background: "var(--card)", width: "100%", maxWidth: 448, maxHeight: "92vh", overflowY: "auto", borderRadius: "1.5rem 1.5rem 0 0", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="font-display" style={{ fontSize: "1.5rem" }}>{initial ? "Editar" : "Nuevo"} movimiento</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <Field label="Tipo">
          <select value={kind} onChange={(e) => { const k = e.target.value as MovementKind; setKind(k); setCategory(CATEGORIES[k][0]); }} className="input">
            {(Object.keys(KIND_LABELS) as MovementKind[]).map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
          </select>
        </Field>
        <Field label="Categoría">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            {CATEGORIES[kind].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Monto"><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" /></Field>
        <Field label="Fecha"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" /></Field>
        <Field label="Origen / destino">
          <select value={source} onChange={(e) => setSource(e.target.value as MovementSource)} className="input">
            <option value="efectivo">Efectivo</option>
            <option value="nequi">Nequi</option>
          </select>
        </Field>
        <Field label="Comentario"><textarea value={comment} onChange={(e) => setComment(e.target.value)} className="input" rows={2} /></Field>
        <button onClick={submit} style={{ width: "100%", padding: "0.75rem", borderRadius: 9999, background: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 500 }}>
          Guardar
        </button>
      </div>
    </div>
  );
}
