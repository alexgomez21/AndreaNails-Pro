import { useMemo } from "react";
import { Calendar, CheckCircle2, Clock, TrendingUp, Wallet, AlertCircle, Users } from "lucide-react";
import { useStore, formatCOP, appointmentTotal, appointmentDebt } from "../lib/store";
import type { Page } from "../App";

export function Home({ navigate }: { navigate: (p: Page) => void }) {
  const { appointments, movements } = useStore();
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthAppts = appointments.filter((a) => a.date.startsWith(ym));
  const done = monthAppts.filter((a) => a.status === "realizado").length;
  const pending = monthAppts.filter((a) => a.status === "pendiente").length;

  const todayStr = now.toISOString().slice(0, 10);
  const today = appointments
    .filter((a) => a.date === todayStr && a.status !== "cancelado")
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const debts = appointments.filter((a) => appointmentDebt(a) > 0 && a.status !== "cancelado");
  const totalDebt = debts.reduce((s, a) => s + appointmentDebt(a), 0);

  const balance = useMemo(() => {
    let cash = 0, nequi = 0;
    movements.forEach((m) => {
      const sign = m.kind === "ingreso_inversion" ? 1 : -1;
      if (m.source === "efectivo") cash += sign * m.amount;
      else nequi += sign * m.amount;
    });
    return { cash, nequi };
  }, [movements]);

  const monthIncome = movements
    .filter((m) => m.date.startsWith(ym) && m.kind === "ingreso_inversion")
    .reduce((s, m) => s + m.amount, 0);

  const frequentClients = useMemo(() => {
    const map = new Map<string, number>();
    monthAppts.forEach((a) => map.set(a.clientName, (map.get(a.clientName) || 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [monthAppts]);

  const frequentHours = useMemo(() => {
    const map = new Map<string, number>();
    monthAppts.forEach((a) => {
      const h = a.startTime.slice(0, 2) + ":00";
      map.set(h, (map.get(h) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [monthAppts]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <section>
        <h1 className="font-display" style={{ fontSize: "1.875rem", color: "var(--foreground)" }}>Hola, Andrea ✨</h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginTop: 4 }}>
          Resumen de {now.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
        </p>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <StatCard icon={Calendar} label="Citas del mes" value={monthAppts.length} accent />
        <StatCard icon={CheckCircle2} label="Realizadas" value={done} />
        <StatCard icon={Clock} label="Pendientes" value={pending} />
        <StatCard icon={TrendingUp} label="Ingresos mes" value={formatCOP(monthIncome)} small />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div style={{ borderRadius: "1rem", background: "linear-gradient(135deg, var(--primary), var(--accent))", padding: "1rem", color: "var(--primary-foreground)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.75rem", opacity: 0.9 }}>
            <Wallet size={16} /> Efectivo
          </div>
          <div className="font-display" style={{ fontSize: "1.5rem", marginTop: 8 }}>{formatCOP(balance.cash)}</div>
        </div>
        <div style={{ borderRadius: "1rem", background: "var(--card)", border: "1px solid var(--border)", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
            <Wallet size={16} /> Nequi
          </div>
          <div className="font-display" style={{ fontSize: "1.5rem", marginTop: 8, color: "var(--foreground)" }}>{formatCOP(balance.nequi)}</div>
        </div>
      </div>

      <Card title="Hoy" action={<button onClick={() => navigate("agenda")} style={{ fontSize: "0.75rem", color: "var(--primary)" }}>Ver agenda →</button>}>
        {today.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", padding: "0.5rem 0" }}>Sin citas hoy.</p>
        ) : (
          <ul style={{ listStyle: "none" }}>
            {today.map((a) => (
              <li key={a.id} style={{ padding: "0.5rem 0", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{a.clientName}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                    {a.startTime} - {a.endTime} · {formatCOP(appointmentTotal(a))}
                  </div>
                </div>
                <span style={{
                  fontSize: "0.625rem", padding: "2px 8px", borderRadius: 9999,
                  background: a.status === "realizado" ? "color-mix(in oklab, var(--success) 15%, transparent)" : "var(--secondary)",
                  color: a.status === "realizado" ? "var(--success)" : "var(--secondary-foreground)",
                }}>{a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Por cobrar" icon={AlertCircle} action={<button onClick={() => navigate("deudas")} style={{ fontSize: "0.75rem", color: "var(--primary)" }}>Ver todo →</button>}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>{debts.length} clientes</span>
          <span className="font-display" style={{ fontSize: "1.25rem", color: "var(--primary)" }}>{formatCOP(totalDebt)}</span>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Card title="Clientas frecuentes" icon={Users}>
          {frequentClients.length === 0 ? <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Sin datos.</p> :
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
              {frequentClients.map(([n, c]) => (
                <li key={n} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span>{n}</span><span style={{ color: "var(--muted-foreground)" }}>{c}</span>
                </li>
              ))}
            </ul>}
        </Card>
        <Card title="Horas frecuentes" icon={Clock}>
          {frequentHours.length === 0 ? <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Sin datos.</p> :
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
              {frequentHours.map(([h, c]) => (
                <li key={h} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span>{h}</span><span style={{ color: "var(--muted-foreground)" }}>{c}</span>
                </li>
              ))}
            </ul>}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, small }: { icon: any; label: string; value: any; accent?: boolean; small?: boolean }) {
  return (
    <div style={{
      borderRadius: "1rem", padding: "1rem",
      background: accent ? "var(--secondary)" : "var(--card)",
      border: accent ? "none" : "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
        <Icon size={16} /> {label}
      </div>
      <div className="font-display" style={{ fontSize: small ? "1.25rem" : "1.875rem", marginTop: 4, color: "var(--foreground)" }}>{value}</div>
    </div>
  );
}

function Card({ title, icon: Icon, children, action }: { title: string; icon?: any; children: any; action?: any }) {
  return (
    <div style={{ borderRadius: "1rem", background: "var(--card)", border: "1px solid var(--border)", padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h3 className="font-display" style={{ fontSize: "1.125rem", color: "var(--foreground)", display: "flex", alignItems: "center", gap: 8 }}>
          {Icon && <Icon size={16} style={{ color: "var(--primary)" }} />}{title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}
