import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      const msg =
        e.code === "auth/invalid-credential" || e.code === "auth/wrong-password"
          ? "Correo o contraseña incorrectos"
          : e.code === "auth/user-not-found"
          ? "No existe una cuenta con ese correo"
          : e.code === "auth/too-many-requests"
          ? "Demasiados intentos. Intenta más tarde"
          : "Error al iniciar sesión";
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, logout, error }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("AuthProvider missing");
  return c;
}
