import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import "./styles/Dashboard.css";

function DefaultRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/app/dashboard" : "/login"} replace />;
}

function SimplePage({ code, title, message }) {
  return (
    <main className="simple-page">
      <section>
        <span>{code}</span>
        <h1>{title}</h1>
        <p>{message}</p>
        <a href="/app/dashboard">Volver al inicio</a>
      </section>
    </main>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DefaultRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route
        path="/app/:module?"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/403"
        element={
          <SimplePage
            code="403"
            title="Acceso no autorizado"
            message="Tu rol no tiene permiso para entrar a esta seccion."
          />
        }
      />
      <Route
        path="*"
        element={
          <SimplePage
            code="404"
            title="Ruta no encontrada"
            message="La pagina solicitada no existe en Acadex."
          />
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
