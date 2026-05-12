import { type ReactNode, useEffect, useRef } from "react";
import { Calendar, LayoutDashboard, Scissors, Wallet, Settings as SettingsIcon } from "lucide-react";
import { useStore } from "../lib/store";
import { toast } from "sonner";
import type { Page } from "../App";

const tabs: { page: Page; label: string; icon: typeof Calendar }[] = [
  { page: "inicio", label: "Inicio", icon: LayoutDashboard },
  { page: "agenda", label: "Agenda", icon: Calendar },
  { page: "servicios", label: "Servicios", icon: Scissors },
  { page: "movimientos", label: "Finanzas", icon: Wallet },
];

export function Layout({ children, page, navigate }: { children: ReactNode; page: Page; navigate: (p: Page) => void }) {
  const { appointments, settings } = useStore();
  const notified = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!settings.notifications) return;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const interval = setInterval(() => {
      const now = new Date();
      appointments.forEach((a) => {
        if (a.status !== "pendiente") return;
        const dt = new Date(`${a.date}T${a.startTime}:00`);
        const diff = (dt.getTime() - now.getTime()) / 60000;
        if (diff > 14 && diff <= 15 && !notified.current.has(a.id)) {
          notified.current.add(a.id);
          const msg = `Cita en 15 min: ${a.clientName} a las ${a.startTime}`;
          toast(msg);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Andrea Gomez Nails", { body: msg });
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [appointments, settings.notifications]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", display: "flex", flexDirection: "column" }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        backdropFilter: "blur(12px)", background: "color-mix(in oklab, var(--background) 80%, transparent)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 768, margin: "0 auto", padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigate("inicio")} style={{ textAlign: "left", lineHeight: 1 }}>
            <div className="font-display" style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--primary)", letterSpacing: "0.02em" }}>Andrea Gomez</div>
            <div className="font-display" style={{ fontSize: "0.85rem", fontStyle: "italic", color: "var(--muted-foreground)", marginTop: -2 }}>Nails Studio</div>
          </button>
          <button
            onClick={() => navigate("ajustes")}
            style={{ width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", color: "var(--muted-foreground)" }}
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 768, width: "100%", margin: "0 auto", padding: "1.5rem 1.25rem 7rem" }}>
        {children}
      </main>

      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
        borderTop: "1px solid var(--border)",
        background: "color-mix(in oklab, var(--background) 95%, transparent)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ maxWidth: 768, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {tabs.map((t) => {
            const active = t.page === page;
            const Icon = t.icon;
            return (
              <button
                key={t.page}
                onClick={() => navigate(t.page)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: "0.75rem 0", fontSize: "0.6875rem", fontWeight: 500,
                  color: active ? "var(--primary)" : "var(--muted-foreground)",
                  transition: "color 0.15s",
                }}
              >
                <Icon size={20} style={{ transform: active ? "scale(1.1)" : "scale(1)", transition: "transform 0.15s" }} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
