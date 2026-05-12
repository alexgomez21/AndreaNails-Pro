import { useAuth } from "../lib/auth";
import { ArrowLeft, Moon, Bell, Download, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "../lib/store";
import type { Page } from "../App";

export function Ajustes({ navigate }: { navigate: (p: Page) => void }) {
  const { settings, setSettings, exportData, resetAll } = useStore();
  const { logout } = useAuth();

  const doExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `andrea-nails-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportado");
  };

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") return toast.error("No soportado");
    const perm = await Notification.requestPermission();
    if (perm === "granted") { setSettings({ notifications: true }); toast.success("Notificaciones activas"); }
    else toast.error("Permiso denegado");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <button onClick={() => navigate("inicio")}
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
        <ArrowLeft size={16} /> Volver
      </button>
      <h1 className="font-display" style={{ fontSize: "1.875rem" }}>Ajustes</h1>

      <div style={{ borderRadius: "1rem", background: "var(--card)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <Row icon={Moon} label="Modo oscuro">
          <Switch checked={settings.darkMode} onChange={(v) => setSettings({ darkMode: v })} />
        </Row>
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <Row icon={Bell} label="Notificaciones (15 min antes)">
            <Switch checked={settings.notifications} onChange={(v) => v ? enableNotifications() : setSettings({ notifications: false })} />
          </Row>
        </div>
        <button onClick={doExport}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "1rem", borderTop: "1px solid var(--border)", textAlign: "left" }}>
          <Download size={20} style={{ color: "var(--primary)" }} /> <span>Exportar datos</span>
        </button>
        <button
          onClick={() => { if (confirm("¿Borrar TODOS los datos?")) { resetAll(); toast.success("Datos borrados"); } }}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "1rem", borderTop: "1px solid var(--border)", textAlign: "left", color: "var(--destructive)" }}>
          <Trash2 size={20} /> <span>Borrar todos los datos</span>
        </button>
        <button
          onClick={() => { logout(); toast.success("Sesión cerrada"); }}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "1rem", borderTop: "1px solid var(--border)", textAlign: "left", color: "var(--destructive)" }}>
          <LogOut size={20} /> <span>Cerrar sesión</span>
        </button>
      </div>

      <div style={{ borderRadius: "1rem", background: "var(--secondary)", padding: "1.25rem", fontSize: "0.875rem" }}>
        <h3 className="font-display" style={{ fontSize: "1.125rem", color: "var(--primary)", marginBottom: 4 }}>Andrea Gomez Nails</h3>
        <p style={{ color: "var(--muted-foreground)", lineHeight: 1.6 }}>
          Sistema de gestión integral para tu negocio de uñas: agenda dinámica de citas,
          control de servicios y precios, registro de pagos (efectivo, Nequi o mixto),
          listado de deudas, finanzas con ingresos, gastos, inversión y retiros.
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: 12 }}>
          Hecho con cariño <span className="font-display" style={{ fontStyle: "italic" }}>by: Alex Gomez</span>
        </p>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, children }: { icon: any; label: string; children: any }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem" }}>
      <Icon size={20} style={{ color: "var(--primary)" }} />
      <span style={{ flex: 1 }}>{label}</span>
      {children}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width: 44, height: 24, borderRadius: 9999, position: "relative",
      background: checked ? "var(--primary)" : "var(--muted)",
      transition: "background 0.2s",
    }}>
      <span style={{
        position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%",
        background: "var(--card)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        left: checked ? 22 : 2, transition: "left 0.2s",
      }} />
    </button>
  );
}
