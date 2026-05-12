import { useMemo, useState } from "react";
import { Plus, X, CheckCircle2, Calendar as CalIcon, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore, formatCOP, appointmentTotal, appointmentDebt, type Appointment, type PaymentMethod, type AppointmentService } from "../lib/store";
import { Field } from "../components/Field";

type View = "dia" | "semana" | "mes";

export function Agenda() {
  const { appointments } = useStore();
  const [view, setView] = useState<View>("dia");
  const [cursor, setCursor] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const visible = useMemo(() => {
    const c = new Date(cursor); c.setHours(0, 0, 0, 0);
    return appointments.filter((a) => {
      const d = new Date(`${a.date}T00:00:00`);
      if (view === "dia") return d.toDateString() === c.toDateString();
      if (view === "semana") {
        const start = new Date(c); start.setDate(c.getDate() - c.getDay());
        const end = new Date(start); end.setDate(start.getDate() + 7);
        return d >= start && d < end;
      }
      return d.getMonth() === c.getMonth() && d.getFullYear() === c.getFullYear();
    }).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [appointments, view, cursor]);

  const shift = (n: number) => {
    const d = new Date(cursor);
    if (view === "dia") d.setDate(d.getDate() + n);
    else if (view === "semana") d.setDate(d.getDate() + n * 7);
    else d.setMonth(d.getMonth() + n);
    setCursor(d);
  };

  const label = view === "dia"
    ? cursor.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })
    : view === "semana"
    ? `Semana del ${cursor.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}`
    : cursor.toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 className="font-display" style={{ fontSize: "1.875rem" }}>Agenda</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "0.5rem 0.875rem", borderRadius: 9999, background: "var(--primary)", color: "var(--primary-foreground)", fontSize: "0.875rem" }}>
          <Plus size={16} /> Cita
        </button>
      </div>

      <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--secondary)", borderRadius: 9999, fontSize: "0.875rem" }}>
        {(["dia", "semana", "mes"] as View[]).map((v) => (
          <button key={v} onClick={() => setView(v)}
            style={{ flex: 1, padding: "0.5rem", borderRadius: 9999, textTransform: "capitalize", transition: "all 0.15s",
              background: view === v ? "var(--card)" : "transparent",
              color: view === v ? "var(--foreground)" : "var(--muted-foreground)",
              boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}>{v}</button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => shift(-1)} style={{ padding: 8, borderRadius: "50%", display: "grid", placeItems: "center" }}><ChevronLeft size={20} /></button>
        <button onClick={() => setCursor(new Date())} className="font-display" style={{ fontSize: "1.125rem", textTransform: "capitalize" }}>{label}</button>
        <button onClick={() => shift(1)} style={{ padding: 8, borderRadius: "50%", display: "grid", placeItems: "center" }}><ChevronRight size={20} /></button>
      </div>

      {view === "mes" && <MonthCalendar cursor={cursor} appts={appointments} onPick={(d) => { setCursor(d); setView("dia"); }} />}

      {visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2.5rem 0", color: "var(--muted-foreground)" }}>
          <CalIcon size={48} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
          Sin citas en este período.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {visible.map((a) => (
            <ApptCard key={a.id} a={a} onEdit={() => { setEditing(a); setShowForm(true); }} />
          ))}
        </div>
      )}

      {showForm && (
        <AppointmentForm
          initial={editing || undefined}
          defaultDate={cursor.toISOString().slice(0, 10)}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function MonthCalendar({ cursor, appts, onPick }: { cursor: Date; appts: Appointment[]; onPick: (d: Date) => void }) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));

  const counts = new Map<string, number>();
  appts.forEach((a) => counts.set(a.date, (counts.get(a.date) || 0) + 1));

  return (
    <div style={{ borderRadius: "1rem", background: "var(--card)", border: "1px solid var(--border)", padding: "0.75rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", fontSize: "0.625rem", color: "var(--muted-foreground)", textAlign: "center", marginBottom: 4 }}>
        {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = d.toISOString().slice(0, 10);
          const c = counts.get(key) || 0;
          const isToday = d.toDateString() === new Date().toDateString();
          return (
            <button key={i} onClick={() => onPick(d)} style={{
              aspectRatio: "1", borderRadius: 8, fontSize: "0.875rem", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: isToday ? "color-mix(in oklab, var(--primary) 10%, transparent)" : "transparent",
              color: isToday ? "var(--primary)" : "var(--foreground)",
              fontWeight: isToday ? 600 : 400,
            }}>
              {d.getDate()}
              {c > 0 && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--primary)", marginTop: 2 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ApptCard({ a, onEdit }: { a: Appointment; onEdit: () => void }) {
  const { markCompleted, deleteAppointment, updateAppointment } = useStore();
  const statusColor = a.status === "realizado" ? { bg: "color-mix(in oklab, var(--success) 15%, transparent)", color: "var(--success)" }
    : a.status === "cancelado" ? { bg: "color-mix(in oklab, var(--destructive) 15%, transparent)", color: "var(--destructive)" }
    : a.status === "pospuesto" ? { bg: "color-mix(in oklab, var(--gold) 20%, transparent)", color: "var(--gold)" }
    : { bg: "var(--secondary)", color: "var(--secondary-foreground)" };

  return (
    <div style={{ borderRadius: "1rem", background: "var(--card)", border: "1px solid var(--border)", padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{a.date} · {a.startTime} - {a.endTime}</div>
          <div className="font-display" style={{ fontSize: "1.25rem", marginTop: 2 }}>{a.clientName}</div>
          {a.whatsapp && <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>WhatsApp: {a.whatsapp}</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {a.services.map((s, i) => <span key={i} className="chip">{s.name}</span>)}
          </div>
        </div>
        <span style={{ fontSize: "0.625rem", padding: "2px 8px", borderRadius: 9999, whiteSpace: "nowrap", background: statusColor.bg, color: statusColor.color }}>
          {a.status}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.6875rem", color: "var(--muted-foreground)" }}>Total</span>
            <span className="font-display" style={{ fontSize: "1.125rem", color: "var(--primary)" }}>{formatCOP(appointmentTotal(a))}</span>
          </div>
          {appointmentDebt(a) > 0 && (
            <div style={{ fontSize: "0.75rem", color: "var(--destructive)", fontWeight: 600 }}>Saldo: {formatCOP(appointmentDebt(a))}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {a.status === "pendiente" && (
            <>
              <button onClick={() => { markCompleted(a.id); toast.success("Marcado realizado ✅"); }}
                style={{ padding: 8, borderRadius: 8, background: "color-mix(in oklab, var(--success) 10%, transparent)", color: "var(--success)" }}>
                <CheckCircle2 size={16} />
              </button>
              <button onClick={() => { updateAppointment(a.id, { status: "pospuesto" }); toast("Pospuesto"); }}
                style={{ padding: "4px 8px", fontSize: "0.75rem", borderRadius: 8, background: "color-mix(in oklab, var(--gold) 15%, transparent)", color: "var(--gold)" }}>
                Posponer
              </button>
              <button onClick={() => { updateAppointment(a.id, { status: "cancelado" }); toast("Cancelado"); }}
                style={{ padding: "4px 8px", fontSize: "0.75rem", borderRadius: 8, background: "color-mix(in oklab, var(--destructive) 10%, transparent)", color: "var(--destructive)" }}>
                Cancelar
              </button>
            </>
          )}
          <button onClick={onEdit} style={{ padding: 8, borderRadius: 8 }}><Pencil size={16} /></button>
          <button onClick={() => { if (confirm("¿Eliminar cita?")) { deleteAppointment(a.id); toast.success("Eliminada"); } }}
            style={{ padding: 8, borderRadius: 8, color: "var(--destructive)" }}><Trash2 size={16} /></button>
        </div>
      </div>
    </div>
  );
}

function AppointmentForm({ initial, defaultDate, onClose }: { initial?: Appointment; defaultDate: string; onClose: () => void }) {
  const { services, addAppointment, updateAppointment } = useStore();
  const [clientName, setClientName] = useState(initial?.clientName || "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp || "");
  const [date, setDate] = useState(initial?.date || defaultDate);
  const [startTime, setStartTime] = useState(initial?.startTime || "09:00");
  const [endTime, setEndTime] = useState(initial?.endTime || "10:00");
  const [selected, setSelected] = useState<AppointmentService[]>(initial?.services || []);
  const [discount, setDiscount] = useState(initial?.discount?.toString() || "0");
  const [tip, setTip] = useState(initial?.tip?.toString() || "0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initial?.paymentMethod || "efectivo");
  const [paidCash, setPaidCash] = useState(initial?.paidCash?.toString() || "0");
  const [paidNequi, setPaidNequi] = useState(initial?.paidNequi?.toString() || "0");
  const [prepaid, setPrepaid] = useState(initial?.prepaid?.toString() || "0");
  const [prepaidSource, setPrepaidSource] = useState(initial?.prepaidSource || "efectivo");
  const [notes, setNotes] = useState(initial?.notes || "");

  const toggle = (id: string) => {
    const s = services.find((x) => x.id === id)!;
    setSelected((prev) => prev.find((x) => x.serviceId === id)
      ? prev.filter((x) => x.serviceId !== id)
      : [...prev, { serviceId: id, name: s.name, price: s.price }]);
  };
  const updatePrice = (id: string, price: number) => {
    setSelected((prev) => prev.map((x) => x.serviceId === id ? { ...x, price } : x));
  };

  const subtotal = selected.reduce((s, x) => s + x.price, 0);
  const total = subtotal - Number(discount || 0);

  const submit = () => {
    if (!clientName.trim()) return toast.error("Falta nombre");
    if (selected.length === 0) return toast.error("Elige al menos un servicio");
    if (endTime <= startTime) return toast.error("Hora final inválida");
    const data = {
      clientName, whatsapp, date, startTime, endTime, services: selected,
      discount: Number(discount || 0), tip: Number(tip || 0), paymentMethod,
      paidCash: paymentMethod === "mixto" ? Number(paidCash || 0) : 0,
      paidNequi: paymentMethod === "mixto" ? Number(paidNequi || 0) : 0,
      prepaid: Number(prepaid || 0), prepaidSource: prepaidSource as "efectivo" | "nequi",
      status: initial?.status || "pendiente" as const, notes,
    };
    if (initial) { updateAppointment(initial.id, data); toast.success("Actualizada"); }
    else { addAppointment(data); toast.success("Cita creada"); }
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "end center" }} onClick={onClose}>
      <div style={{ background: "var(--card)", width: "100%", maxWidth: 512, maxHeight: "92vh", overflowY: "auto", borderRadius: "1.5rem 1.5rem 0 0", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="font-display" style={{ fontSize: "1.5rem" }}>{initial ? "Editar" : "Nueva"} cita</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <Field label="Nombre"><input value={clientName} onChange={(e) => setClientName(e.target.value)} className="input" /></Field>
        <Field label="WhatsApp (opcional)"><input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="input" placeholder="+57..." /></Field>
        <Field label="Fecha"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Field label="Inicio"><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" /></Field>
          <Field label="Fin"><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" /></Field>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Servicios</span>
          <div style={{ marginTop: 4, maxHeight: 192, overflowY: "auto", borderRadius: "0.75rem", border: "1px solid var(--border)", padding: 8 }}>
            {services.map((s) => {
              const sel = selected.find((x) => x.serviceId === s.id);
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", padding: "4px 0" }}>
                  <input type="checkbox" checked={!!sel} onChange={() => toggle(s.id)} style={{ accentColor: "var(--primary)" }} />
                  <span style={{ flex: 1 }}>{s.name}</span>
                  {sel ? (
                    <input type="number" value={sel.price} onChange={(e) => updatePrice(s.id, Number(e.target.value))} className="input" style={{ width: 96, padding: "4px 8px" }} />
                  ) : (
                    <span style={{ color: "var(--muted-foreground)", fontSize: "0.75rem" }}>{formatCOP(s.price)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Field label="Descuento"><input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="input" /></Field>
          <Field label="Propina"><input type="number" value={tip} onChange={(e) => setTip(e.target.value)} className="input" /></Field>
        </div>
        <Field label="Forma de pago">
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="input">
            <option value="efectivo">Efectivo</option>
            <option value="nequi">Nequi</option>
            <option value="mixto">Mixto</option>
            <option value="pendiente">Pendiente (fiar)</option>
          </select>
        </Field>
        {paymentMethod === "mixto" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Field label="Efectivo"><input type="number" value={paidCash} onChange={(e) => setPaidCash(e.target.value)} className="input" /></Field>
            <Field label="Nequi"><input type="number" value={paidNequi} onChange={(e) => setPaidNequi(e.target.value)} className="input" /></Field>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Field label="Abono"><input type="number" value={prepaid} onChange={(e) => setPrepaid(e.target.value)} className="input" /></Field>
          <Field label="Pago abono">
            <select value={prepaidSource} onChange={(e) => setPrepaidSource(e.target.value as "efectivo" | "nequi")} className="input">
              <option value="efectivo">Efectivo</option>
              <option value="nequi">Nequi</option>
            </select>
          </Field>
        </div>
        <Field label="Notas"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" rows={2} /></Field>
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Total</span>
          <span className="font-display" style={{ fontSize: "1.5rem", color: "var(--primary)" }}>{formatCOP(total)}</span>
        </div>
        <button onClick={submit} style={{ width: "100%", padding: "0.75rem", borderRadius: 9999, background: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 500 }}>
          {initial ? "Guardar cambios" : "Agendar cita"}
        </button>
      </div>
    </div>
  );
}
