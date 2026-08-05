import { useCallback, useMemo, useState } from "react";
import { CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { NotificationItem } from "../../components/NotificationItem";
import { EmptyState, ErrorAlert, LoadingSkeleton, SearchInput, SuccessMessage } from "../../components/ui";
import { useAsyncResource } from "../../hooks/useAsyncResource";
import { apiMessage } from "../../services/api";
import { notificationService } from "../../services/notificationService";

const routeFor = (notification, role) => {
  const type = notification.relatedResource?.type;
  if (type === "task") return "/app/tasks";
  if (type === "course" || type === "enrollment") return "/app/courses";
  if (type === "event") return "/app/events";
  if (type === "submission" || type === "submission_file_scan") return role === "admin" ? "/app/tasks" : "/app/submissions";
  return null;
};

export function NotificationsModule({ user }) {
  const navigate = useNavigate();
  const load = useCallback(() => notificationService.list(), []);
  const { data: notifications = [], error: loadError, loading, setData } = useAsyncResource(load, "No se pudieron cargar las notificaciones.");
  const [query, setQuery] = useState(""); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [saving, setSaving] = useState(false);
  const filtered = useMemo(() => (notifications || []).filter((item) => `${item.title || ""} ${item.message || ""}`.toLowerCase().includes(query.toLowerCase())), [notifications, query]);

  const open = async (notification) => {
    setError("");
    try { if (!notification.isRead) { await notificationService.markRead(notification.id); setData((current) => current.map((item) => item.id === notification.id ? { ...item, isRead: true } : item)); } const route = routeFor(notification, user.role); if (route) navigate(route); } catch (readError) { setError(apiMessage(readError, "No se pudo abrir la notificacion.")); }
  };
  const markAll = async () => {
    setSaving(true); setError("");
    try { await notificationService.markAllRead(); setData((current) => current.map((item) => ({ ...item, isRead: true }))); setMessage("Todas las notificaciones quedaron marcadas como leidas."); } catch (readError) { setError(apiMessage(readError, "No se pudieron marcar las notificaciones.")); } finally { setSaving(false); }
  };

  return <div className="module-stack"><div className="module-heading"><div><h2>Centro de notificaciones</h2><p>Selecciona una novedad para abrir la tarea, curso o evento relacionado.</p></div><button className="secondary-button" type="button" onClick={markAll} disabled={saving || !(notifications || []).some((item) => !item.isRead)}><CheckCheck size={18} />{saving ? "Marcando..." : "Marcar todas como leidas"}</button></div>
    <ErrorAlert message={error || loadError} /><SuccessMessage message={message} />
    <section className="panel notification-panel"><div className="toolbar"><SearchInput value={query} onChange={setQuery} placeholder="Buscar notificaciones" /></div>{loading ? <LoadingSkeleton /> : filtered.length ? <div className="notification-feed">{filtered.map((item) => <NotificationItem key={item.id} notification={item} onOpen={open} />)}</div> : <EmptyState title="Todo al dia" message="No tienes notificaciones con esa busqueda." />}</section>
  </div>;
}
