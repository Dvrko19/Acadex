import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { apiMessage } from "../services/api";
import "../App.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const submit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      await login({ email, password });
      navigate(location.state?.from?.pathname || "/app/dashboard", { replace: true });
    } catch (error) {
      setMessage(apiMessage(error, "No se pudo iniciar sesion"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="left-panel">
        <div>
          <div className="brand-mark">A</div>
          <h1>Acadex</h1>
          <p>Gestion academica por roles, tareas, entregas y eventos.</p>
        </div>
      </div>

      <div className="right-panel">
        <form className="card" onSubmit={submit}>
          <h2>Iniciar sesion</h2>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Contrasena</label>
          <input
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Iniciando sesion..." : "Iniciar sesion"}
          </button>

          {message && <p className="login-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default Login;
