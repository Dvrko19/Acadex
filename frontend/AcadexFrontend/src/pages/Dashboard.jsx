import { Navigate, useParams } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { CoursesModule } from "../features/dashboard/CoursesModule";
import { DashboardHome } from "../features/dashboard/DashboardHome";
import { EventsModule } from "../features/dashboard/EventsModule";
import { NotificationsModule } from "../features/dashboard/NotificationsModule";
import { SubmissionsModule } from "../features/dashboard/SubmissionsModule";
import { TasksModule } from "../features/dashboard/TasksModule";
import { UsersModule } from "../features/dashboard/UsersModule";
import "../styles/Dashboard.css";

const roleModules = {
  admin: ["dashboard", "users", "courses", "tasks", "events", "notifications"],
  teacher: ["dashboard", "courses", "tasks", "submissions", "events", "notifications"],
  student: ["dashboard", "courses", "tasks", "submissions", "events", "notifications"]
};

const titles = {
  dashboard: "Inicio",
  users: "Usuarios",
  courses: "Cursos",
  tasks: "Tareas",
  submissions: "Entregas",
  events: "Eventos",
  notifications: "Notificaciones"
};

const modules = {
  dashboard: DashboardHome,
  users: UsersModule,
  courses: CoursesModule,
  tasks: TasksModule,
  submissions: SubmissionsModule,
  events: EventsModule,
  notifications: NotificationsModule
};

export default function Dashboard() {
  const { module = "dashboard" } = useParams();
  const { user } = useAuth();
  if (!(roleModules[user.role] || []).includes(module)) return <Navigate to="/403" replace />;

  const ActiveModule = modules[module];
  const title = module === "courses" && user.role !== "admin" ? "Mis cursos" : module === "submissions" && user.role === "student" ? "Mis entregas" : titles[module];
  return <DashboardLayout title={title}><ActiveModule user={user} /></DashboardLayout>;
}
