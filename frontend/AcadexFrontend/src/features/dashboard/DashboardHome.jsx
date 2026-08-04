import { useCallback } from "react";
import { BookOpen, Bell, CalendarDays, CheckCircle2, ClipboardCheck, FileWarning, GraduationCap, NotebookTabs, UserRoundCheck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { EmptyState, ErrorAlert, LoadingSkeleton, ScanStatusBadge, StatCard, StatusBadge } from "../../components/ui";
import { useAsyncResource } from "../../hooks/useAsyncResource";
import { courseService } from "../../services/courseService";
import { dashboardService } from "../../services/dashboardService";
import { eventService } from "../../services/eventService";
import { submissionService } from "../../services/submissionService";
import { taskService } from "../../services/taskService";
import { userService } from "../../services/userService";
import { formatDateTime, timeRemaining } from "../../utils/dateTime";

const take = (items, count = 5) => (items || []).slice(0, count);

export function DashboardHome({ user }) {
  const navigate = useNavigate();
  const load = useCallback(async () => {
    const base = await dashboardService.getDashboard();
    if (user.role === "admin") {
      const [users, courses, tasks, events, submissions] = await Promise.all([userService.list(), courseService.list(), taskService.list(), eventService.list(), submissionService.list()]);
      return { base, users, courses, tasks, events, submissions };
    }
    if (user.role === "teacher") {
      const [tasks, submissions, events] = await Promise.all([taskService.list(), submissionService.list(), eventService.list()]);
      return { base, tasks, submissions, events };
    }
    const [tasks, submissions, events] = await Promise.all([taskService.list(), submissionService.mySubmissions(), eventService.list()]);
    return { base, tasks, submissions, events };
  }, [user.role]);
  const { data, error, loading } = useAsyncResource(load, "No se pudo preparar tu inicio.");

  if (loading) return <div className="dashboard-sections"><LoadingSkeleton rows={3} /><LoadingSkeleton rows={5} /></div>;
  if (error) return <ErrorAlert message={error} />;
  if (!data) return <EmptyState message="No hay novedades para mostrar." />;
  if (user.role === "admin") return <AdminHome data={data} navigate={navigate} />;
  if (user.role === "teacher") return <TeacherHome data={data} navigate={navigate} />;
  return <StudentHome data={data} navigate={navigate} />;
}

function AdminHome({ data, navigate }) {
  const students = data.users.filter((item) => item.role === "student");
  const teachers = data.users.filter((item) => item.role === "teacher");
  const scanIncidents = data.submissions.filter((item) => ["infected", "scan_failed"].includes(item.scanStatus));
  return <div className="dashboard-sections">
    <div className="stats-grid five"><StatCard label="Estudiantes" value={students.length} icon={GraduationCap} tone="blue" /><StatCard label="Profesores" value={teachers.length} icon={Users} tone="purple" /><StatCard label="Cursos activos" value={data.courses.filter((item) => item.status === "active").length} icon={BookOpen} tone="green" /><StatCard label="Tareas activas" value={data.tasks.filter((item) => item.status === "published").length} icon={NotebookTabs} tone="orange" /><StatCard label="Sin leer" value={data.base.unreadNotifications} icon={Bell} tone="gray" /></div>
    <div className="dashboard-grid two">
      <DashboardSection title="Usuarios agregados recientemente" action="Ver usuarios" onAction={() => navigate("/app/users")}>
        <CompactList items={take([...data.users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))} render={(item) => <><span className="list-icon"><UserRoundCheck size={18} /></span><span><strong>{item.fullName || item.name}</strong><small>{item.email}</small></span><StatusBadge value={item.status} /></>} />
      </DashboardSection>
      <DashboardSection title="Cursos recientes" action="Ver cursos" onAction={() => navigate("/app/courses")}>
        <CompactList items={take([...data.courses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))} render={(item) => <><span className="list-icon"><BookOpen size={18} /></span><span><strong>{item.name}</strong><small>{item.teacher || "Profesor por confirmar"}</small></span><StatusBadge value={item.status} /></>} />
      </DashboardSection>
      <DashboardSection title="Proximos eventos" action="Ver eventos" onAction={() => navigate("/app/events")}><EventList events={data.events} /></DashboardSection>
      <DashboardSection title="Estado del analisis automatico">
        <CompactList items={take(scanIncidents)} empty="No hay incidencias en el analisis de archivos." render={(item) => <><span className="list-icon warning"><FileWarning size={18} /></span><span><strong>{item.originalFileName || "Archivo de entrega"}</strong><small>{item.scanStatus === "infected" ? "Rechazado por la validacion automatica" : "El servicio automatico no completo la revision"}</small></span><ScanStatusBadge value={item.scanStatus} /></>} />
      </DashboardSection>
    </div>
  </div>;
}

function TeacherHome({ data, navigate }) {
  const pending = data.submissions.filter((item) => ["submitted", "late"].includes(item.status) && item.scanStatus === "clean");
  const upcoming = [...data.tasks].filter((item) => new Date(item.dueDate) >= new Date()).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  return <div className="dashboard-sections">
    <div className="stats-grid five"><StatCard label="Mis cursos" value={data.base.myCourses} icon={BookOpen} tone="blue" /><StatCard label="Tareas creadas" value={data.base.createdTasks} icon={NotebookTabs} tone="purple" /><StatCard label="Entregas recibidas" value={data.base.receivedSubmissions} icon={ClipboardCheck} tone="green" /><StatCard label="Pendientes de calificar" value={data.base.pendingReviews} icon={CheckCircle2} tone="orange" /><StatCard label="Sin leer" value={data.base.unreadNotifications} icon={Bell} tone="gray" /></div>
    <div className="dashboard-grid teacher-home">
      <DashboardSection title="Entregas pendientes de revision" action="Revisar entregas" onAction={() => navigate("/app/submissions")}>
        <CompactList items={take(pending, 6)} empty="No tienes entregas pendientes de calificar." render={(item) => <><span className="list-icon"><ClipboardCheck size={18} /></span><span><strong>{item.taskTitle}</strong><small>{item.studentFullName || item.studentName} · {item.courseName}</small></span><span className="list-date">{formatDateTime(item.submittedAt)}</span></>} />
      </DashboardSection>
      <DashboardSection title="Proximas fechas importantes" action="Ver tareas" onAction={() => navigate("/app/tasks")}>
        <CompactList items={take(upcoming)} empty="No hay fechas proximas." render={(item) => <><span className="list-icon"><CalendarDays size={18} /></span><span><strong>{item.title}</strong><small>{item.courseName} · {timeRemaining(item.dueDate)}</small></span><span className="list-date">{formatDateTime(item.dueDate)}</span></>} />
      </DashboardSection>
      <DashboardSection title="Actividad reciente de mis cursos" action="Ver eventos" onAction={() => navigate("/app/events")}><EventList events={data.events} /></DashboardSection>
    </div>
  </div>;
}

function StudentHome({ data, navigate }) {
  const graded = data.submissions.filter((item) => item.status === "graded" || item.grade !== null);
  const pending = data.tasks.filter((item) => !item.submissionId);
  return <div className="dashboard-sections">
    <div className="stats-grid five"><StatCard label="Mis cursos" value={data.base.myCourses} icon={BookOpen} tone="blue" /><StatCard label="Tareas pendientes" value={data.base.pendingTasks} icon={NotebookTabs} tone="orange" /><StatCard label="Entregas realizadas" value={data.base.totalSubmissions} icon={ClipboardCheck} tone="green" /><StatCard label="Tareas calificadas" value={graded.length} icon={CheckCircle2} tone="purple" /><StatCard label="Sin leer" value={data.base.unreadNotifications} icon={Bell} tone="gray" /></div>
    <div className="dashboard-grid student-home">
      <DashboardSection title="Proximas tareas" action="Ver tareas" onAction={() => navigate("/app/tasks")}>
        <CompactList items={take(pending)} empty="No tienes tareas pendientes." render={(item) => <><span className="list-icon"><NotebookTabs size={18} /></span><span><strong>{item.title}</strong><small>{item.courseName} · PDF o PowerPoint</small></span><span className="list-date"><strong>{timeRemaining(item.dueDate)}</strong><small>{formatDateTime(item.dueDate)}</small></span></>} />
      </DashboardSection>
      <DashboardSection title="Calificaciones recientes" action="Ver mis entregas" onAction={() => navigate("/app/submissions")}>
        <CompactList items={take(graded)} empty="Tus tareas calificadas apareceran aqui." render={(item) => <><span className="list-icon success"><CheckCircle2 size={18} /></span><span><strong>{item.taskTitle}</strong><small>{item.courseName}{item.feedback ? ` · ${item.feedback}` : ""}</small></span><strong className="grade-value">{item.grade}/{item.maxScore}</strong></>} />
      </DashboardSection>
      <DashboardSection title="Eventos proximos" action="Ver eventos" onAction={() => navigate("/app/events")}><EventList events={data.events} /></DashboardSection>
    </div>
  </div>;
}

function DashboardSection({ title, action, onAction, children }) {
  return <section className="panel dashboard-panel"><header className="section-heading"><h2>{title}</h2>{action && <button className="text-button" type="button" onClick={onAction}>{action}</button>}</header>{children}</section>;
}

function CompactList({ items, render, empty = "No hay informacion para mostrar." }) {
  if (!items.length) return <EmptyState message={empty} />;
  return <div className="compact-list">{items.map((item, index) => <div className="compact-item" key={item.id ?? index}>{render(item)}</div>)}</div>;
}

function EventList({ events }) {
  const upcoming = take([...events].filter((item) => new Date(item.startDate || item.createdAt) >= new Date()).sort((a, b) => new Date(a.startDate) - new Date(b.startDate)));
  return <CompactList items={upcoming} empty="No hay eventos proximos." render={(item) => <><span className="list-icon"><CalendarDays size={18} /></span><span><strong>{item.title || item.eventType}</strong><small>{item.courseName || "Actividad general"}</small></span><span className="list-date">{formatDateTime(item.startDate || item.createdAt)}</span></>} />;
}
