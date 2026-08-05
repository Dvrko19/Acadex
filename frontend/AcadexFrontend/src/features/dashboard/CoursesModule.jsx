import { useCallback, useMemo, useState } from "react";
import { BookOpen, Pencil, Plus, UserPlus } from "lucide-react";

import { UserSearchAutocomplete } from "../../components/UserSearchAutocomplete";
import { ConfirmDialog, DataTable, EmptyState, ErrorAlert, LoadingSkeleton, Pagination, SearchInput, StatusBadge, SuccessMessage } from "../../components/ui";
import { useAsyncResource } from "../../hooks/useAsyncResource";
import { apiMessage } from "../../services/api";
import { courseService } from "../../services/courseService";
import { formatDateTime } from "../../utils/dateTime";

const blankCourse = { id: null, name: "", description: "", status: "active", teacher: null };

export function CoursesModule({ user }) {
  const load = useCallback(() => user.role === "admin" ? courseService.list() : courseService.myCourses(), [user.role]);
  const { data: courses = [], error: loadError, loading, reload } = useAsyncResource(load, "No se pudieron cargar los cursos.");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null);
  const [enroll, setEnroll] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(null);
  const filtered = useMemo(() => (courses || []).filter((item) => `${item.name} ${item.teacher || ""}`.toLowerCase().includes(query.toLowerCase())), [courses, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 8));
  const rows = filtered.slice((page - 1) * 8, page * 8);

  const edit = (course) => setForm({ ...blankCourse, ...course, teacher: { id: course.teacherId, fullName: course.teacher || course.teacherName || "Profesor asignado", email: course.teacherEmail || "" } });
  const saveCourse = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const payload = { name: form.name, description: form.description, status: form.status, teacherId: Number(form.teacher?.id) };
      if (form.id) await courseService.update(form.id, payload); else await courseService.create(payload);
      setMessage(form.id ? "Curso actualizado correctamente." : "Curso creado correctamente."); setForm(null); reload();
    } catch (saveError) { setError(apiMessage(saveError, "No se pudo guardar el curso.")); } finally { setSaving(false); }
  };
  const enrollStudent = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try { await courseService.enroll(enroll.courseId, enroll.student.id); setMessage(`${enroll.student.fullName || enroll.student.name} fue matriculado correctamente.`); setEnroll(null); } catch (saveError) { setError(apiMessage(saveError, "No se pudo matricular al estudiante.")); } finally { setSaving(false); }
  };
  const remove = async () => { const target = confirm; setConfirm(null); try { await courseService.remove(target.id); setMessage("Curso desactivado correctamente."); reload(); } catch (removeError) { setError(apiMessage(removeError, "No se pudo desactivar el curso.")); } };

  return <div className="module-stack">
    <div className="module-heading"><div><h2>{user.role === "admin" ? "Gestion de cursos" : "Cursos asignados"}</h2><p>{user.role === "student" ? "Consulta tus materias, profesor y estado de avance." : user.role === "teacher" ? "Consulta los cursos que tienes a tu cargo." : "Asigna profesores y matricula estudiantes mediante una busqueda rapida."}</p></div>{user.role === "admin" && <div className="heading-actions"><button className="secondary-button" type="button" onClick={() => setEnroll({ courseId: "", student: null })}><UserPlus size={18} />Matricular</button><button type="button" onClick={() => setForm({ ...blankCourse })}><Plus size={18} />Nuevo curso</button></div>}</div>
    <ErrorAlert message={error || loadError} /><SuccessMessage message={message} />
    {form && <section className="panel form-section"><div className="section-heading"><h2>{form.id ? "Editar curso" : "Nuevo curso"}</h2></div><form className="form-grid" onSubmit={saveCourse}>
      <Field label="Nombre del curso"><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></Field>
      <UserSearchAutocomplete label="Profesor" role="teacher" value={form.teacher} onChange={(teacher) => setForm((current) => ({ ...current, teacher }))} />
      <Field label="Estado"><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="active">Activo</option><option value="inactive">Inactivo</option></select></Field>
      <Field label="Descripcion"><textarea value={form.description || ""} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></Field>
      <div className="form-actions full"><button type="submit" disabled={saving || !form.teacher}>{saving ? "Guardando..." : "Guardar curso"}</button><button className="secondary-button" type="button" onClick={() => setForm(null)}>Cancelar</button></div>
    </form></section>}
    {enroll && <section className="panel form-section"><div className="section-heading"><h2>Matricular estudiante</h2></div><form className="form-grid" onSubmit={enrollStudent}>
      <Field label="Curso"><select value={enroll.courseId} onChange={(event) => setEnroll((current) => ({ ...current, courseId: event.target.value }))} required><option value="">Seleccionar curso</option>{courses.map((course) => <option value={course.id} key={course.id}>{course.name}</option>)}</select></Field>
      <UserSearchAutocomplete label="Estudiante" role="student" value={enroll.student} onChange={(student) => setEnroll((current) => ({ ...current, student }))} />
      <div className="form-actions full"><button type="submit" disabled={saving || !enroll.student}>{saving ? "Matriculando..." : "Matricular estudiante"}</button><button className="secondary-button" type="button" onClick={() => setEnroll(null)}>Cancelar</button></div>
    </form></section>}
    <section className="panel"><div className="toolbar"><SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Buscar por curso o profesor" /></div>
      {loading ? <LoadingSkeleton /> : rows.length ? <DataTable columns={[{ key: "name", label: "Curso", render: (item) => <div className="primary-cell"><strong>{item.name}</strong><small>{item.description || "Sin descripcion"}</small></div> }, { key: "teacher", label: "Profesor", render: (item) => item.teacher || item.teacherName || "Por asignar" }, { key: "status", label: "Estado", render: (item) => <StatusBadge value={item.status} /> }, { key: "createdAt", label: "Creado", render: (item) => formatDateTime(item.createdAt) }]} rows={rows} actions={user.role === "admin" ? (item) => <div className="row-actions"><button className="icon-text-button" type="button" onClick={() => edit(item)}><Pencil size={16} />Editar</button><button className="icon-text-button danger-quiet" type="button" onClick={() => setConfirm(item)}>Desactivar</button></div> : null} /> : <EmptyState icon={BookOpen} message="No hay cursos con esa busqueda." />}
      <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} onChange={setPage} /></section>
    {confirm && <ConfirmDialog title="Desactivar curso" message={`El curso ${confirm.name} dejara de estar disponible.`} onCancel={() => setConfirm(null)} onConfirm={remove} />}
  </div>;
}

function Field({ label, children }) { return <label className="form-field"><span>{label}</span>{children}</label>; }
