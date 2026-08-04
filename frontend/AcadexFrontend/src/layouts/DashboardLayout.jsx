import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  House,
  LogOut,
  Menu,
  NotebookTabs,
  Users,
  X
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../hooks/useAuth";

const roleLabels = { admin: "Administrador", teacher: "Profesor", student: "Estudiante" };
const navIcons = { dashboard: House, users: Users, courses: BookOpen, tasks: NotebookTabs, submissions: ClipboardCheck, events: CalendarDays, notifications: Bell };
const roleNav = {
  admin: [["dashboard", "Inicio"], ["users", "Usuarios"], ["courses", "Cursos"], ["tasks", "Tareas"], ["events", "Eventos"], ["notifications", "Notificaciones"]],
  teacher: [["dashboard", "Inicio"], ["courses", "Mis cursos"], ["tasks", "Tareas"], ["submissions", "Entregas"], ["events", "Eventos"], ["notifications", "Notificaciones"]],
  student: [["dashboard", "Inicio"], ["courses", "Mis cursos"], ["tasks", "Tareas"], ["submissions", "Mis entregas"], ["events", "Eventos"], ["notifications", "Notificaciones"]]
};

function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const exit = () => { logout(); navigate("/login", { replace: true }); };

  return <>
    <button className={`sidebar-overlay ${open ? "visible" : ""}`} type="button" onClick={onClose} aria-label="Cerrar menu" />
    <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Navegacion principal">
      <div className="sidebar-brand"><span className="sidebar-mark"><GraduationCap size={22} /></span><div><strong>Acadex</strong><small>Plataforma educativa</small></div><button className="icon-button sidebar-close" type="button" onClick={onClose} aria-label="Cerrar menu"><X size={20} /></button></div>
      <div className="role-chip"><span>{(user.name || "U").charAt(0).toUpperCase()}</span><div><strong>{user.name}</strong><small>{roleLabels[user.role]}</small></div></div>
      <nav className="sidebar-nav">{(roleNav[user.role] || []).map(([key, label]) => {
        const Icon = navIcons[key];
        return <NavLink key={key} to={`/app/${key}`} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} onClick={onClose}><Icon size={19} /><span>{label}</span></NavLink>;
      })}</nav>
      <button className="logout-button" type="button" onClick={exit}><LogOut size={19} /><span>Cerrar sesion</span></button>
    </aside>
  </>;
}

function Header({ title, onMenu }) {
  const { user } = useAuth();
  return <header className="dashboard-header">
    <button className="icon-button menu-button" type="button" onClick={onMenu} aria-label="Abrir menu"><Menu size={22} /></button>
    <div className="page-title"><h1>{title}</h1><p>Hola, {user.name}. Que gusto verte.</p></div>
    <div className="header-actions"><NotificationBell /><div className="user-avatar" title={roleLabels[user.role]}>{user.name?.charAt(0).toUpperCase() || "U"}</div></div>
  </header>;
}

export function DashboardLayout({ title, children }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const closeForbidden = () => setOpen(false);
    window.addEventListener("acadex:forbidden", closeForbidden);
    return () => window.removeEventListener("acadex:forbidden", closeForbidden);
  }, []);
  return <div className="dashboard-layout"><Sidebar open={open} onClose={() => setOpen(false)} /><main className="dashboard-content"><Header title={title} onMenu={() => setOpen(true)} /><div className="page-content">{children}</div></main></div>;
}
