import { useState } from "react";
import { useAuth } from "../lib/auth";

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) { setError("Completa todos los campos"); return; }
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--background)", padding: "1.5rem",
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: "var(--card)", borderRadius: "1.5rem",
        border: "1px solid var(--border)", padding: "2rem",
        display: "flex", flexDirection: "column", gap: "1.25rem",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div className="font-display" style={{ fontSize: "2rem", color: "var(--primary)", letterSpacing: "0.02em" }}>
            Andrea Gomez
          </div>
          <div className="font-display" style={{ fontSize: "1rem", fontStyle: "italic", color: "var(--muted-foreground)" }}>
            Nails Studio
          </div>
          <div style={{
            width: 48, height: 3, borderRadius: 9999,
            background: "var(--primary)", margin: "0.75rem auto 0",
          }} />
        </div>

        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, textAlign: "center", color: "var(--foreground)" }}>
            Iniciar sesión
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", textAlign: "center", marginTop: 4 }}>
            Accede a tu panel de gestión
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", display: "block", marginBottom: 4 }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="correo@ejemplo.com"
              className="input"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", display: "block", marginBottom: 4 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••••"
              className="input"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            padding: "0.625rem 0.875rem", borderRadius: "0.625rem",
            background: "color-mix(in oklab, var(--destructive) 10%, transparent)",
            color: "var(--destructive)", fontSize: "0.875rem",
          }}>
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: "100%", padding: "0.875rem", borderRadius: 9999,
            background: loading ? "var(--muted)" : "var(--primary)",
            color: "var(--primary-foreground)", fontWeight: 600,
            fontSize: "1rem", transition: "all 0.2s",
            opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", textAlign: "center" }}>
          Solo Andrea puede acceder a este panel.
        </p>
      </div>
    </div>
  );
}
