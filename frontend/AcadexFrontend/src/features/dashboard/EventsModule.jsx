import { useCallback, useMemo, useState } from "react";
import { CalendarDays, ExternalLink, Plus, Trash2 } from "lucide-react";

import { ConfirmDialog, CourseSelector, DataTable, DateTimeField, EmptyState, ErrorAlert, LoadingSkeleton, Pagination, SearchInput, SuccessMessage } from "../../components/ui";
import { useAsyncResource } from "../../hooks/useAsyncResource";
import { apiMessage } from "../../services/api";
import { courseService } from "../../services/courseService";
import { eventService } from "../../services/eventService";
import { formatDateTime, isValidHttpUrl, toApiDateTime } from "../../utils/dateTime";

const blankEvent = { courseId: "", title: "", description: "", eventType: "class", startDate: "", endDate: "", location: "", meetingUrl: "" };

export function EventsModule({ user }) {
  const load = useCallback(async () => { const [courses, events] = await Promise.all([user.role === "admin" ? courseService.list() : courseService.myCourses(), eventService.list()]); return { courses, events }; }, [user.role]);
  const { data, error: loadError, loading, reload } = useAsyncResource(load, "No se pudieron cargar los eventos.");
  const courses = data?.courses || []; const events = useMemo(() => data?.events || [], [data?.events]);
  const [form, setForm] = useState(null); const [query, setQuery] = useState(""); const [page, setPage] = useState(1); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [confirm, setConfirm] = useState(null);
  const filtered = useMemo(() => events.filter((item) => `${item.title || ""} ${item.eventType || ""} ${item.courseName || ""}`.toLowerCase().includes(query.toLowerCase())), [events, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 8)); const rows = filtered.slice((page - 1) * 8, page * 8);
  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    const startDate = toApiDateTime(form.startDate); const endDate = toApiDateTime(form.endDate);
    if (!startDate) return setError("La fecha de inicio no es valida.");
    if (!endDate) return setError("La fecha de finalizacion no es valida.");
    if (new Date(endDate) <= new Date(startDate)) return setError("La fecha de finalizacion debe ser posterior al inicio.");
    if (!isValidHttpUrl(form.meetingUrl)) return setError("El enlace de reunion no es valido.");
    setSaving(true);
    try { await eventService.create({ ...form, courseId: form.courseId ? Number(form.courseId) : null, startDate, endDate, meetingUrl: form.meetingUrl || null }); setMessage("Evento creado correctamente."); setForm(null); reload(); } catch (saveError) { setError(apiMessage(saveError, "No se pudo crear el evento. Intentalo nuevamente.")); } finally { setSaving(false); }
  };
  const remove = async () => { const target = confirm; setConfirm(null); try { await eventService.remove(target.id); setMessage("Evento eliminado correctamente."); reload(); } catch (removeError) { setError(apiMessage(removeError, "No se pudo eliminar el evento.")); } };

  return <div className="module-stack">
    <div className="module-heading"><div><h2>Calendario escolar</h2><p>{user.role === "student" ? "Consulta clases, examenes y actividades importantes." : "Organiza clases, evaluaciones y reuniones para tus cursos."}</p></div>{user.role !== "student" && <button type="button" onClick={() => setForm({ ...blankEvent })}><Plus size={18} />Nuevo evento</button>}</div>
    <ErrorAlert message={error || loadError} /><SuccessMessage message={message} />
    {form && <section className="panel form-section"><div className="section-heading"><h2>Nuevo evento</h2></div><form className="form-grid" onSubmit={submit}>
      <CourseSelector courses={courses} value={form.courseId} onChange={(value) => change("courseId", value)} allowGeneral />
      <Field label="Titulo"><input value={form.title} onChange={(event) => change("title", event.target.value)} required /></Field>
      <Field label="Tipo de evento"><select value={form.eventType} onChange={(event) => change("eventType", event.target.value)}><option value="class">Clase</option><option value="exam">Examen</option><option value="deadline">Fecha limite</option><option value="meeting">Reunion</option><option value="general">Actividad general</option></select></Field>
      <DateTimeField label="Fecha de inicio" value={form.startDate} onChange={(value) => change("startDate", value)} required />
      <DateTimeField label="Fecha de finalizacion" value={form.endDate} onChange={(value) => change("endDate", value)} min={form.startDate} required />
      <Field label="Lugar (opcional)"><input value={form.location} onChange={(event) => change("location", event.target.value)} /></Field>
      <Field label="Enlace de reunion (opcional)"><input type="url" value={form.meetingUrl} onChange={(event) => change("meetingUrl", event.target.value)} placeholder="https://..." /></Field>
      <Field label="Descripcion"><textarea value={form.description} onChange={(event) => change("description", event.target.value)} /></Field>
      <div className="form-actions full"><button type="submit" disabled={saving}>{saving ? "Creando..." : "Crear evento"}</button><button className="secondary-button" type="button" onClick={() => setForm(null)}>Cancelar</button></div>
    </form></section>}
    <section className="panel"><div className="toolbar"><SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Buscar evento o curso" /></div>
      {loading ? <LoadingSkeleton /> : rows.length ? <DataTable columns={[{ key: "title", label: "Evento", render: (item) => <div className="primary-cell"><strong>{item.title || item.eventType}</strong><small>{item.description || "Sin descripcion"}</small></div> }, { key: "courseName", label: "Curso", render: (item) => item.courseName || "Actividad general" }, { key: "eventType", label: "Tipo", render: (item) => eventTypeLabels[item.eventType] || item.eventType }, { key: "startDate", label: "Inicio", render: (item) => formatDateTime(item.startDate || item.createdAt) }, { key: "endDate", label: "Finalizacion", render: (item) => formatDateTime(item.endDate) }]} rows={rows} actions={(item) => <div className="row-actions">{item.meetingUrl && <a className="icon-text-button" href={item.meetingUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} />Unirme</a>}{user.role !== "student" && <button className="icon-text-button danger-quiet" type="button" onClick={() => setConfirm(item)}><Trash2 size={16} />Eliminar</button>}</div>} /> : <EmptyState icon={CalendarDays} message="No hay eventos con esa busqueda." />}
      <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} onChange={setPage} /></section>
    {confirm && <ConfirmDialog title="Eliminar evento" message={`Se eliminara ${confirm.title || "este evento"} del calendario.`} onCancel={() => setConfirm(null)} onConfirm={remove} />}
  </div>;
}

const eventTypeLabels = { class: "Clase", exam: "Examen", deadline: "Fecha limite", meeting: "Reunion", general: "General" };
function Field({ label, children }) { return <label className="form-field"><span>{label}</span>{children}</label>; }
