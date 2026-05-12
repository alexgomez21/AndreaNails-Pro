import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useStore, formatCOP, type Service } from "../lib/store";
import { Field } from "../components/Field";

const CATEGORIES = ["Tradicional", "Semipermanente", "Especiales", "Otros"];

export function Servicios() {
  const { services, addService, updateService, deleteService } = useStore();
  const [editing, setEditing] = useState<Service | null>(null);
  const [showNew, setShowNew] = useState(false);

  const grouped = CATEGORIES.map((cat) => ({
    cat, items: services.filter((s) => s.category === cat),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 className="font-display" style={{ fontSize: "1.875rem" }}>Servicios</h1>
        <button onClick={() => setShowNew(true)}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "0.5rem 0.875rem", borderRadius: 9999, background: "var(--primary)", color: "var(--primary-foreground)", fontSize: "0.875rem" }}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {grouped.map((g) => g.items.length === 0 ? null : (
        <div key={g.cat}>
          <h2 className="font-display" style={{ fontSize: "1.125rem", color: "var(--primary)", marginBottom: 8 }}>{g.cat}</h2>
          <div style={{ borderRadius: "1rem", background: "var(--card)", border: "1px solid var(--border)", overflow: "hidden" }}>
            {g.items.map((s, idx) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem",
                borderTop: idx > 0 ? "1px solid var(--border)" : "none",
              }}>
                <div>
                  <div style={{ fontWeight: 500, color: "var(--foreground)" }}>{s.name}</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>{formatCOP(s.price)}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setEditing(s)} style={{ padding: 8, borderRadius: 8 }}><Pencil size={16} /></button>
                  <button onClick={() => { if (confirm(`¿Eliminar "${s.name}"?`)) { deleteService(s.id); toast.success("Eliminado"); } }}
                    style={{ padding: 8, borderRadius: 8, color: "var(--destructive)" }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {(editing || showNew) && (
        <ServiceModal
          initial={editing || undefined}
          onClose={() => { setEditing(null); setShowNew(false); }}
          onSave={(data) => {
            if (editing) { updateService(editing.id, data); toast.success("Actualizado"); }
            else { addService(data); toast.success("Creado"); }
            setEditing(null); setShowNew(false);
          }}
        />
      )}
    </div>
  );
}

function ServiceModal({ initial, onClose, onSave }: { initial?: Service; onClose: () => void; onSave: (s: Omit<Service, "id">) => void }) {
  const [name, setName] = useState(initial?.name || "");
  const [price, setPrice] = useState(initial?.price?.toString() || "");
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "end center" }} onClick={onClose}>
      <div style={{ background: "var(--card)", width: "100%", maxWidth: 448, borderRadius: "1.5rem 1.5rem 0 0", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="font-display" style={{ fontSize: "1.5rem" }}>{initial ? "Editar" : "Nuevo"} servicio</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <Field label="Nombre"><input value={name} onChange={(e) => setName(e.target.value)} className="input" /></Field>
        <Field label="Precio (COP)"><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input" /></Field>
        <Field label="Categoría">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <button
          onClick={() => { if (!name || !price) return toast.error("Completa los campos"); onSave({ name, price: Number(price), category }); }}
          style={{ width: "100%", padding: "0.75rem", borderRadius: 9999, background: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 500 }}>
          Guardar
        </button>
      </div>
    </div>
  );
}
