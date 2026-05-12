import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth";

export type Service = { id: string; name: string; price: number; category: string };
export type AppointmentService = { serviceId: string; name: string; price: number };
export type PaymentMethod = "efectivo" | "nequi" | "mixto" | "pendiente";
export type AppointmentStatus = "pendiente" | "realizado" | "cancelado" | "pospuesto";

export type Appointment = {
  id: string; clientName: string; whatsapp?: string;
  date: string; startTime: string; endTime: string;
  services: AppointmentService[]; discount: number; tip: number;
  paymentMethod: PaymentMethod; paidCash: number; paidNequi: number;
  prepaid: number; prepaidSource?: MovementSource;
  status: AppointmentStatus; notes?: string; createdAt: number;
};

export type MovementKind = "ingreso_inversion" | "gasto" | "inversion" | "retiro";
export type MovementSource = "efectivo" | "nequi";
export type Movement = {
  id: string; kind: MovementKind; category: string; amount: number;
  date: string; comment?: string; source: MovementSource;
  appointmentId?: string; autoType?: "servicio" | "propina" | "deuda" | "abono";
};

type Settings = { darkMode: boolean; notifications: boolean };

type Ctx = {
  services: Service[]; appointments: Appointment[]; movements: Movement[];
  settings: Settings; loaded: boolean;
  addService: (s: Omit<Service, "id">) => Promise<void>;
  updateService: (id: string, s: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addAppointment: (a: Omit<Appointment, "id" | "createdAt">) => Promise<void>;
  updateAppointment: (id: string, a: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  markCompleted: (id: string) => Promise<void>;
  addMovement: (m: Omit<Movement, "id">) => Promise<void>;
  updateMovement: (id: string, m: Partial<Movement>) => Promise<void>;
  deleteMovement: (id: string) => Promise<void>;
  setSettings: (s: Partial<Settings>) => Promise<void>;
  resetAll: () => Promise<void>;
  exportData: () => string;
};

const defaultServices: Service[] = [
  { id: "s1", name: "Manicure", price: 15000, category: "Tradicional" },
  { id: "s2", name: "Pedicure", price: 17000, category: "Tradicional" },
  { id: "s3", name: "Manicure semipermanente", price: 30000, category: "Semipermanente" },
  { id: "s4", name: "Pedicure semipermanente", price: 30000, category: "Semipermanente" },
  { id: "s5", name: "Baño de polygel", price: 65000, category: "Especiales" },
  { id: "s6", name: "Base rubber", price: 55000, category: "Especiales" },
  { id: "s7", name: "Polygel", price: 75000, category: "Especiales" },
  { id: "s8", name: "Press on", price: 60000, category: "Especiales" },
  { id: "s9", name: "Retoques", price: 55000, category: "Otros" },
  { id: "s10", name: "Uña adicional", price: 3000, category: "Otros" },
  { id: "s11", name: "Retiro semipermanente", price: 5000, category: "Otros" },
  { id: "s12", name: "Retiro sistemas artificiales", price: 12000, category: "Otros" },
];

const StoreCtx = createContext<Ctx | null>(null);
const newId = () => Math.random().toString(36).slice(2, 10);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user!.uid;

  const colRef = (name: string) => collection(db, "users", userId, name);
  const docRef = (col: string, id: string) => doc(db, "users", userId, col, id);
  const settingsRef = doc(db, "users", userId, "meta", "settings");

  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [settings, setSettingsState] = useState<Settings>({ darkMode: false, notifications: false });
  const [loaded, setLoaded] = useState(false);
  const [servicesSeeded, setServicesSeeded] = useState(false);

  useEffect(() => {
    const unsubs = [
      onSnapshot(colRef("services"), (snap) => {
        if (!snap.metadata.fromCache && snap.empty && !servicesSeeded) {
          setServicesSeeded(true);
          const batch = writeBatch(db);
          defaultServices.forEach((s) => batch.set(docRef("services", s.id), s));
          batch.commit();
        } else {
          setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service)));
        }
      }),
      onSnapshot(colRef("appointments"), (snap) => {
        setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)));
        setLoaded(true);
      }),
      onSnapshot(colRef("movements"), (snap) => {
        setMovements(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Movement)));
      }),
      onSnapshot(settingsRef, (snap) => {
        if (snap.exists()) setSettingsState(snap.data() as Settings);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [userId]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }, [settings.darkMode]);

  const ctx: Ctx = useMemo(() => ({
    services, appointments, movements, settings, loaded,

    addService: async (s) => {
      const id = newId();
      await setDoc(docRef("services", id), { ...s, id });
    },
    updateService: async (id, s) => {
      await setDoc(docRef("services", id), s, { merge: true });
    },
    deleteService: async (id) => {
      await deleteDoc(docRef("services", id));
    },

    addAppointment: async (a) => {
      const id = newId();
      const appt = { ...a, id, createdAt: Date.now() };
      const batch = writeBatch(db);
      batch.set(docRef("appointments", id), appt);
      if (appt.prepaid > 0) {
        const mid = newId();
        batch.set(docRef("movements", mid), {
          id: mid, kind: "ingreso_inversion", category: "Abono",
          amount: appt.prepaid, date: appt.date,
          comment: `Abono: ${appt.clientName}`,
          source: appt.prepaidSource || "efectivo",
          appointmentId: id, autoType: "abono",
        });
      }
      await batch.commit();
    },

    updateAppointment: async (id, a) => {
      const current = appointments.find((x) => x.id === id);
      if (!current) return;
      const next = { ...current, ...a };
      const batch = writeBatch(db);
      batch.set(docRef("appointments", id), next, { merge: true });
      movements.filter((m) => m.appointmentId === id && m.autoType === "abono")
        .forEach((m) => batch.delete(docRef("movements", m.id)));
      if (next.prepaid > 0) {
        const mid = newId();
        batch.set(docRef("movements", mid), {
          id: mid, kind: "ingreso_inversion", category: "Abono",
          amount: next.prepaid, date: next.date,
          comment: `Abono: ${next.clientName}`,
          source: next.prepaidSource || "efectivo",
          appointmentId: id, autoType: "abono",
        });
      }
      await batch.commit();
    },

    deleteAppointment: async (id) => {
      const batch = writeBatch(db);
      batch.delete(docRef("appointments", id));
      movements.filter((m) => m.appointmentId === id)
        .forEach((m) => batch.delete(docRef("movements", m.id)));
      await batch.commit();
    },

    markCompleted: async (id) => {
      const appt = appointments.find((a) => a.id === id);
      if (!appt) return;
      const total = appointmentTotal(appt);
      const prepaid = appt.prepaid || 0;
      const paidCash = appt.paymentMethod === "efectivo" ? Math.max(0, total - prepaid)
        : appt.paymentMethod === "pendiente" ? 0 : appt.paidCash || 0;
      const paidNequi = appt.paymentMethod === "nequi" ? Math.max(0, total - prepaid)
        : appt.paymentMethod === "pendiente" ? 0 : appt.paidNequi || 0;
      const batch = writeBatch(db);
      batch.set(docRef("appointments", id), { ...appt, status: "realizado", paidCash, paidNequi }, { merge: true });
      movements.filter((m) => m.appointmentId === id && (m.autoType === "servicio" || m.autoType === "propina"))
        .forEach((m) => batch.delete(docRef("movements", m.id)));
      if (paidCash > 0) {
        const mid = newId();
        batch.set(docRef("movements", mid), { id: mid, kind: "ingreso_inversion", category: "Servicio", amount: paidCash, date: appt.date, comment: `Servicio: ${appt.clientName}`, source: "efectivo", appointmentId: id, autoType: "servicio" });
      }
      if (paidNequi > 0) {
        const mid = newId();
        batch.set(docRef("movements", mid), { id: mid, kind: "ingreso_inversion", category: "Servicio", amount: paidNequi, date: appt.date, comment: `Servicio: ${appt.clientName}`, source: "nequi", appointmentId: id, autoType: "servicio" });
      }
      if (appt.tip > 0) {
        const mid = newId();
        const tipSrc: MovementSource = appt.paymentMethod === "nequi" ? "nequi" : "efectivo";
        batch.set(docRef("movements", mid), { id: mid, kind: "ingreso_inversion", category: "Propina", amount: appt.tip, date: appt.date, comment: `Propina: ${appt.clientName}`, source: tipSrc, appointmentId: id, autoType: "propina" });
      }
      await batch.commit();
    },

    addMovement: async (m) => { const id = newId(); await setDoc(docRef("movements", id), { ...m, id }); },
    updateMovement: async (id, m) => { await setDoc(docRef("movements", id), m, { merge: true }); },
    deleteMovement: async (id) => { await deleteDoc(docRef("movements", id)); },

    setSettings: async (s) => {
      const next = { ...settings, ...s };
      setSettingsState(next);
      await setDoc(settingsRef, next, { merge: true });
    },

    resetAll: async () => {
      const batch = writeBatch(db);
      appointments.forEach((a) => batch.delete(docRef("appointments", a.id)));
      movements.forEach((m) => batch.delete(docRef("movements", m.id)));
      await batch.commit();
    },

    exportData: () => JSON.stringify({ services, appointments, movements, settings }, null, 2),
  }), [services, appointments, movements, settings, loaded]);

  return <StoreCtx.Provider value={ctx}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}

export const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

export function appointmentTotal(a: Appointment) {
  return a.services.reduce((s, x) => s + x.price, 0) - a.discount;
}
export function appointmentDebt(a: Appointment) {
  const total = appointmentTotal(a);
  const paid = (a.paidCash || 0) + (a.paidNequi || 0) + (a.prepaid || 0);
  return Math.max(0, total - paid);
}
