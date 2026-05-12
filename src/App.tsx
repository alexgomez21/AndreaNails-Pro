import { useState } from "react";
import { AuthProvider, useAuth } from "./lib/auth";
import { StoreProvider } from "./lib/store";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { Agenda } from "./pages/Agenda";
import { Servicios } from "./pages/Servicios";
import { Movimientos } from "./pages/Movimientos";
import { Deudas } from "./pages/Deudas";
import { Ajustes } from "./pages/Ajustes";
import { Toaster } from "sonner";

export type Page = "inicio" | "agenda" | "servicios" | "movimientos" | "deudas" | "ajustes";

function AppInner() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>("inicio");

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--background)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="font-display" style={{ fontSize: "2rem", color: "var(--primary)" }}>Andrea Gomez</div>
          <div className="font-display" style={{ fontStyle: "italic", color: "var(--muted-foreground)" }}>Nails Studio</div>
          <div style={{ marginTop: "1.5rem", width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "1.5rem auto 0" }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Login />;

  const navigate = (p: Page) => setPage(p);

  const renderPage = () => {
    switch (page) {
      case "inicio": return <Home navigate={navigate} />;
      case "agenda": return <Agenda />;
      case "servicios": return <Servicios />;
      case "movimientos": return <Movimientos navigate={navigate} />;
      case "deudas": return <Deudas navigate={navigate} />;
      case "ajustes": return <Ajustes navigate={navigate} />;
    }
  };

  return (
    <StoreProvider>
      <Layout page={page} navigate={navigate}>
        {renderPage()}
      </Layout>
    </StoreProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}
