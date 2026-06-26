import { useNavigate } from "react-router-dom";

import "../styles/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");

  const user = storedUser
    ? JSON.parse(storedUser)
    : null;

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    navigate("/login");
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>🎓</span>
          <span>Acadex</span>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">
            Inicio
          </button>

          <button className="nav-item">
            Cursos
          </button>

          <button className="nav-item">
            Tareas
          </button>

          <button className="nav-item">
            Notificaciones
          </button>

          <button className="nav-item">
            Reportes
          </button>

          <button className="nav-item">
            Eventos
          </button>
        </nav>

        <button
          className="logout-button"
          onClick={logout}
        >
          Cerrar sesión
        </button>
      </aside>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>
              Bienvenido,{" "}
              {user?.name || "Usuario"}
            </h1>

            <p>
              Este es el resumen de tu actividad
              académica.
            </p>
          </div>

          <div className="user-avatar">
            {user?.name
              ? user.name.charAt(0).toUpperCase()
              : "U"}
          </div>
        </header>

        <section className="summary-grid">
          <article className="summary-card">
            <div className="summary-icon">
              📚
            </div>

            <div>
              <p>Mis cursos</p>
              <strong>4</strong>
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-icon">
              📋
            </div>

            <div>
              <p>Tareas pendientes</p>
              <strong>7</strong>
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-icon">
              🔔
            </div>

            <div>
              <p>Notificaciones</p>
              <strong>3</strong>
            </div>
          </article>
        </section>

        <section className="tasks-section">
          <h2>Tareas pendientes</h2>

          <article className="task-item">
            <div>
              <h3>
                Algoritmos - Tarea 2
              </h3>

              <p>
                Entrega: 29/06/2026
              </p>
            </div>

            <button>
              Ver tarea
            </button>
          </article>

          <article className="task-item">
            <div>
              <h3>
                Base de Datos - Tarea 1
              </h3>

              <p>
                Entrega: 05/07/2026
              </p>
            </div>

            <button>
              Ver tarea
            </button>
          </article>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;