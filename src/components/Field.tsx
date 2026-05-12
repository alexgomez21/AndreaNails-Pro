import type { ReactNode } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{label}</span>
      <div style={{ marginTop: 4 }}>{children}</div>
    </label>
  );
}
