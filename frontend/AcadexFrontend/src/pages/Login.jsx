import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../App.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const response = await axios.post(
        "http://localhost:4000/api/auth/login",
        {
          email,
          password
        }
      );

      console.log("Respuesta:", response.data);

      const {token ,user} = response.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user",JSON.stringify(user));

      setMessage("Inicio de sesión exitoso");

      navigate("/Dashboard");
    } catch (error) {
      console.error(error);

      const errorMessage =
        error.response?.data?.message ||
        "No se pudo iniciar sesión";

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="left-panel">
        <div>
          <div className="icon">🎓</div>

          <h1>Acadex</h1>

          <p>
            Plataforma académica
            <br />
            orientada a eventos
          </p>
        </div>
      </div>

      <div className="right-panel">
        <form
          className="card"
          onSubmit={login}
        >
          <h2>Iniciar sesión</h2>

          <label htmlFor="email">
            Email
          </label>

          <input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <label htmlFor="password">
            Contraseña
          </label>

          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Iniciando sesión..."
              : "Iniciar sesión"}
          </button>

          {message && (
            <p className="login-message">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default Login;