import { useCallback, useMemo, useState } from "react";
import { ClipboardCheck, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { FileUpload } from "../../components/FileUpload";
import { ConfirmDialog, CourseSelector, DataTable, DateTimeField, EmptyState, ErrorAlert, LoadingSkeleton, Modal, Pagination, SearchInput, SelectFilter, StatusBadge, SuccessMessage } from "../../components/ui";
import { useAsyncResource } from "../../hooks/useAsyncResource";
import { apiMessage } from "../../services/api";
import { courseService } from "../../services/courseService";
import { submissionService } from "../../services/submissionService";
import { taskService } from "../../services/taskService";
import { formatDateTime, timeRemaining, toApiDateTime, toDateTimeLocal } from "../../utils/dateTime";

const blankTask = { id: null, courseId: "", title: "", description: "", dueDate: "", maxScore: 100, status: "published" };

export function TasksModule({ user }) {
  const navigate = useNavigate();
  const load = useCallback(async () => { const [courses, tasks] = await Promise.all([user.role === "admin" ? courseService.list() : courseService.myCourses(), taskService.list()]); return { courses, tasks }; }, [user.role]);
  const { data, error: loadError, loading, reload } = useAsyncResource(load, "No se pudieron cargar las tareas.");
  const courses = data?.courses || []; const tasks = useMemo(() => data?.tasks || [], [data?.tasks]);
  const [query, setQuery] = useState(""); const [courseFilter, setCourseFilter] = useState(""); const [statusFilter, setStatusFilter] = useState(""); const [tab, setTab] = useState("pending"); const [page, setPage] = useState(1);
  const [form, setForm] = useState(null); const [delivery, setDelivery] = useState(null); const [file, setFile] = useState(null); const [progress, setProgress] = useState(0); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [confirm, setConfirm] = useState(null);

  const filtered = useMemo(() => tasks.filter((item) => {
    const completed = Boolean(item.submissionId);
    return `${item.title} ${item.courseName}`.toLowerCase().includes(query.toLowerCase()) && (!courseFilter || Number(item.courseId) === Number(courseFilter)) && (!statusFilter || (item.submissionStatus || item.status) === statusFilter) && (user.role !== "student" || (tab === "completed" ? completed : !completed));
  }), [courseFilter, query, statusFilter, tab, tasks, user.role]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 8)); const rows = filtered.slice((page - 1) * 8, page * 8);

  const saveTask = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    const dueDate = toApiDateTime(form.dueDate);
    if (!dueDate) return setError("La fecha limite no es valida.");
    if (Number(form.maxScore) <= 0) return setError("La puntuacion maxima debe ser mayor que cero.");
    setSaving(true);
    try { const payload = { courseId: Number(form.courseId), title: form.title.trim(), description: form.description.trim(), dueDate, maxScore: Number(form.maxScore), status: form.status }; if (form.id) await taskService.update(form.id, payload); else await taskService.create(payload); setMessage(form.id ? "Tarea actualizada correctamente." : "Tarea creada correctamente."); setForm(null); reload(); } catch (saveError) { setError(apiMessage(saveError, "No se pudo crear la tarea. Revisa los datos.")); } finally { setSaving(false); }
  };
  const sendFile = async (event) => {
    event.preventDefault(); if (!file) return setError("Selecciona un archivo antes de entregar la tarea.");
    setSaving(true); setProgress(0); setError(""); setMessage("");
    try {
      const submission = delivery.submissionId
        ? await submissionService.update(delivery.submissionId, { file, onProgress: setProgress })
        : await submissionService.create({ taskId: delivery.id, file, onProgress: setProgress });
      if (submission.scanStatus === "clean") setMessage("Archivo entregado y validado correctamente.");
      else if (submission.scanStatus === "infected") setError("La validacion automatica rechazo el archivo.");
      else if (submission.scanStatus === "scan_failed") setError("La validacion automatica no pudo completarse. El archivo permanece aislado.");
      else setMessage("Archivo entregado. La validacion automatica esta en curso.");
      setDelivery(null); setFile(null); reload();
    } catch (uploadError) { setError(apiMessage(uploadError, "No se pudo entregar el archivo.")); } finally { setSaving(false); }
  };
  const removeTask = async () => { const target = confirm; setConfirm(null); try { await taskService.remove(target.id); setMessage("Tarea desactivada correctamente."); reload(); } catch (removeError) { setError(apiMessage(removeError, "No se pudo desactivar la tarea.")); } };

  return <div className="module-stack">
    <div className="module-heading"><div><h2>{user.role === "student" ? "Mis tareas" : "Gestion de tareas"}</h2><p>{user.role === "student" ? "Revisa las fechas limite y envia tus trabajos en PDF o PowerPoint." : "Crea actividades con fechas y puntuaciones claras para tus cursos."}</p></div>{user.role !== "student" && <button type="button" onClick={() => setForm({ ...blankTask })}><Plus size={18} />Nueva tarea</button>}</div>
    <ErrorAlert message={error || loadError} /><SuccessMessage message={message} />
    {form && <section className="panel form-section"><div className="section-heading"><h2>{form.id ? "Editar tarea" : "Nueva tarea"}</h2></div><form className="form-grid" onSubmit={saveTask}>
      <CourseSelector courses={courses} value={form.courseId} onChange={(value) => setForm((current) => ({ ...current, courseId: value }))} />
      <Field label="Titulo"><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required /></Field>
      <DateTimeField label="Fecha limite" value={form.dueDate} onChange={(value) => setForm((current) => ({ ...current, dueDate: value }))} required />
      <Field label="Puntuacion maxima"><input type="number" min="1" step="1" value={form.maxScore} onChange={(event) => setForm((current) => ({ ...current, maxScore: event.target.value }))} required /></Field>
      <Field label="Estado"><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="published">Publicada</option><option value="draft">Borrador</option><option value="closed">Cerrada</option></select></Field>
      <Field label="Descripcion"><textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></Field>
      <div className="form-actions full"><button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar tarea"}</button><button className="secondary-button" type="button" onClick={() => setForm(null)}>Cancelar</button></div>
    </form></section>}
    <section className="panel"><div className="toolbar"><SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Buscar tarea o curso" /><SelectFilter label="Curso" value={courseFilter} onChange={(value) => { setCourseFilter(value); setPage(1); }} options={courses.map((item) => ({ value: item.id, label: item.name }))} /><SelectFilter label="Estado" value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(1); }} options={[{ value: "published", label: "Publicada" }, { value: "submitted", label: "Esperando revision" }, { value: "graded", label: "Calificada" }, { value: "closed", label: "Cerrada" }]} /></div>
      {user.role === "student" && <div className="tabs" role="tablist"><button className={tab === "pending" ? "active" : ""} type="button" onClick={() => { setTab("pending"); setPage(1); }}>Pendientes</button><button className={tab === "completed" ? "active" : ""} type="button" onClick={() => { setTab("completed"); setPage(1); }}>Entregadas</button></div>}
      {loading ? <LoadingSkeleton /> : rows.length ? <DataTable columns={[{ key: "title", label: "Tarea", render: (item) => <div className="primary-cell"><strong>{item.title}</strong><small>{item.description || "Sin indicaciones adicionales"}</small></div> }, { key: "courseName", label: "Curso" }, { key: "dueDate", label: "Fecha limite", render: (item) => <div className="primary-cell"><span>{formatDateTime(item.dueDate)}</span><small className={timeRemaining(item.dueDate) === "Fecha vencida" ? "error-text" : ""}>{timeRemaining(item.dueDate)}</small></div> }, { key: "maxScore", label: "Puntos" }, { key: "status", label: "Estado", render: (item) => <StatusBadge value={item.submissionStatus || item.status} /> }]} rows={rows} actions={(item) => <div className="row-actions">{user.role === "student" ? (item.submissionId ? <button className="icon-text-button" type="button" onClick={() => navigate("/app/submissions")}><ClipboardCheck size={16} />Ver mi entrega</button> : <button className="icon-text-button" type="button" onClick={() => { setDelivery(item); setFile(null); setProgress(0); }}><Send size={16} />Entregar tarea</button>) : <><button className="icon-text-button" type="button" onClick={() => setForm({ ...item, dueDate: toDateTimeLocal(item.dueDate) })}><Pencil size={16} />Editar</button>{user.role === "teacher" && <button className="icon-text-button" type="button" onClick={() => navigate("/app/submissions")}><ClipboardCheck size={16} />Entregas</button>}<button className="icon-text-button danger-quiet" type="button" onClick={() => setConfirm(item)}><Trash2 size={16} />Desactivar</button></>}</div>} /> : <EmptyState message={user.role === "student" ? "No tienes tareas en esta seccion." : "No hay tareas con esos filtros."} />}
      <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} onChange={setPage} /></section>
    {delivery && <Modal title={`Entregar: ${delivery.title}`} onClose={() => !saving && setDelivery(null)} wide><form className="upload-form" onSubmit={sendFile}><p className="modal-intro">Puedes enviar un archivo PDF o PowerPoint (.pptx).</p><FileUpload file={file} onChange={setFile} progress={progress} uploading={saving} /><div className="form-actions end"><button className="secondary-button" type="button" onClick={() => setDelivery(null)} disabled={saving}>Cancelar</button><button type="submit" disabled={saving || !file}>{saving ? "Subiendo archivo..." : "Entregar tarea"}</button></div></form></Modal>}
    {confirm && <ConfirmDialog title="Desactivar tarea" message={`La tarea ${confirm.title} dejara de estar disponible.`} onCancel={() => setConfirm(null)} onConfirm={removeTask} />}
  </div>;
}

function Field({ label, children }) { return <label className="form-field"><span>{label}</span>{children}</label>; }
