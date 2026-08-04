import { useCallback, useMemo, useState } from "react";
import { Pencil, Plus, UserMinus, Users } from "lucide-react";

import { UserSearchAutocomplete } from "../../components/UserSearchAutocomplete";
import { ConfirmDialog, DataTable, EmptyState, ErrorAlert, LoadingSkeleton, Pagination, SelectFilter, StatusBadge, SuccessMessage } from "../../components/ui";
import { useAsyncResource } from "../../hooks/useAsyncResource";
import { apiMessage } from "../../services/api";
import { userService } from "../../services/userService";
import { formatDateTime } from "../../utils/dateTime";

const blankUser = { id: null, name: "", lastName: "", email: "", dateOfBirth: "", phone: "", role: "student", status: "active", password: "", studentNumber: "", gradeLevel: "", section: "", academicYear: String(new Date().getFullYear()), guardianName: "", guardianPhone: "", employeeNumber: "", subjectArea: "" };
const roleLabels = { admin: "Administrador", teacher: "Profesor", student: "Estudiante" };

export function UsersModule() {
  const load = useCallback(() => userService.list(), []);
  const { data: users = [], error: loadError, loading, reload } = useAsyncResource(load, "No se pudieron cargar los usuarios.");
  const [form, setForm] = useState(null);
  const [selectedSearch, setSelectedSearch] = useState(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const filtered = useMemo(() => (users || []).filter((item) => (!selectedSearch || Number(item.id) === Number(selectedSearch.id)) && (!roleFilter || item.role === roleFilter) && (!statusFilter || item.status === statusFilter)), [roleFilter, selectedSearch, statusFilter, users]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 8));
  const rows = filtered.slice((page - 1) * 8, page * 8);

  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const edit = (item) => setForm({ ...blankUser, ...item, password: "", dateOfBirth: item.dateOfBirth || "" });
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      delete payload.id; delete payload.age; delete payload.fullName; delete payload.createdAt; delete payload.updatedAt; delete payload.deletedAt;
      if (form.id) await userService.update(form.id, payload); else await userService.create(payload);
      setForm(null); setMessage(form.id ? "Usuario actualizado correctamente." : "Usuario creado correctamente."); reload();
    } catch (saveError) { setError(apiMessage(saveError, "No se pudo guardar el usuario.")); } finally { setSaving(false); }
  };
  const deactivate = async () => {
    const target = confirm;
    setConfirm(null); setError("");
    try { await userService.remove(target.id); setMessage("Usuario desactivado correctamente."); reload(); } catch (removeError) { setError(apiMessage(removeError, "No se pudo desactivar el usuario.")); }
  };

  return <div className="module-stack">
    <div className="module-heading"><div><h2>Gestion de usuarios</h2><p>Administra los datos personales y escolares de la comunidad educativa.</p></div><button type="button" onClick={() => setForm({ ...blankUser })}><Plus size={18} />Nuevo usuario</button></div>
    <ErrorAlert message={error || loadError} /><SuccessMessage message={message} />
    {form && <section className="panel form-section"><div className="section-heading"><h2>{form.id ? "Editar usuario" : "Nuevo usuario"}<small>Los campos cambian de acuerdo con el rol seleccionado.</small></h2></div><form className="form-grid user-form" onSubmit={submit}>
      <Field label="Nombre"><input value={form.name} onChange={(event) => change("name", event.target.value)} required /></Field>
      <Field label="Apellido"><input value={form.lastName} onChange={(event) => change("lastName", event.target.value)} required /></Field>
      <Field label="Correo electronico"><input type="email" value={form.email} onChange={(event) => change("email", event.target.value)} required /></Field>
      <Field label="Fecha de nacimiento"><input type="date" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth || ""} onChange={(event) => change("dateOfBirth", event.target.value)} /></Field>
      <Field label="Telefono (opcional)"><input type="tel" value={form.phone || ""} onChange={(event) => change("phone", event.target.value)} /></Field>
      <Field label="Rol"><select value={form.role} onChange={(event) => change("role", event.target.value)}><option value="student">Estudiante</option><option value="teacher">Profesor</option><option value="admin">Administrador</option></select></Field>
      <Field label="Estado"><select value={form.status} onChange={(event) => change("status", event.target.value)}><option value="active">Activo</option><option value="inactive">Inactivo</option></select></Field>
      <Field label={form.id ? "Nueva contrasena (opcional)" : "Contrasena"}><input type="password" minLength={8} value={form.password} onChange={(event) => change("password", event.target.value)} required={!form.id} /></Field>
      {form.role === "student" && <>
        <Field label="Matricula o codigo"><input value={form.studentNumber || ""} onChange={(event) => change("studentNumber", event.target.value)} required /></Field>
        <Field label="Grado o curso"><input value={form.gradeLevel || ""} onChange={(event) => change("gradeLevel", event.target.value)} placeholder="4to de secundaria" required /></Field>
        <Field label="Seccion"><input value={form.section || ""} onChange={(event) => change("section", event.target.value)} required /></Field>
        <Field label="Ano escolar"><input value={form.academicYear || ""} onChange={(event) => change("academicYear", event.target.value)} required /></Field>
        <Field label="Nombre del tutor (opcional)"><input value={form.guardianName || ""} onChange={(event) => change("guardianName", event.target.value)} /></Field>
        <Field label="Telefono del tutor (opcional)"><input type="tel" value={form.guardianPhone || ""} onChange={(event) => change("guardianPhone", event.target.value)} /></Field>
      </>}
      {form.role === "teacher" && <><Field label="Codigo de empleado"><input value={form.employeeNumber || ""} onChange={(event) => change("employeeNumber", event.target.value)} /></Field><Field label="Area o asignatura principal"><input value={form.subjectArea || ""} onChange={(event) => change("subjectArea", event.target.value)} required /></Field></>}
      <div className="form-actions full"><button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar usuario"}</button><button className="secondary-button" type="button" onClick={() => setForm(null)}>Cancelar</button></div>
    </form></section>}
    <section className="panel"><div className="toolbar">
      <UserSearchAutocomplete label="Buscar usuario" value={selectedSearch} onChange={(value) => { setSelectedSearch(value); setPage(1); }} placeholder="Nombre, apellido o correo" />
      <SelectFilter label="Rol" value={roleFilter} onChange={(value) => { setRoleFilter(value); setPage(1); }} options={[{ value: "admin", label: "Administrador" }, { value: "teacher", label: "Profesor" }, { value: "student", label: "Estudiante" }]} />
      <SelectFilter label="Estado" value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(1); }} options={[{ value: "active", label: "Activo" }, { value: "inactive", label: "Inactivo" }]} />
    </div>
    {loading ? <LoadingSkeleton /> : filtered.length ? <><DataTable columns={[{ key: "fullName", label: "Nombre", render: (item) => <div className="primary-cell"><strong>{item.fullName || `${item.name} ${item.lastName || ""}`}</strong><small>{item.email}</small></div> }, { key: "role", label: "Rol", render: (item) => roleLabels[item.role] }, { key: "school", label: "Datos escolares", render: (item) => item.role === "student" ? `${item.gradeLevel || "-"} · Seccion ${item.section || "-"}` : item.role === "teacher" ? (item.subjectArea || "Sin area") : "Administracion" }, { key: "status", label: "Estado", render: (item) => <StatusBadge value={item.status} /> }, { key: "createdAt", label: "Registro", render: (item) => formatDateTime(item.createdAt) }]} rows={rows} actions={(item) => <div className="row-actions"><button className="icon-text-button" type="button" onClick={() => edit(item)}><Pencil size={16} />Editar</button><button className="icon-text-button danger-quiet" type="button" onClick={() => setConfirm(item)}><UserMinus size={16} />Desactivar</button></div>} /></> : <EmptyState icon={Users} message="No hay usuarios con esos filtros." />}
    <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} onChange={setPage} /></section>
    {confirm && <ConfirmDialog title="Desactivar usuario" message={`El usuario ${confirm.fullName || confirm.name} ya no podra ingresar a Acadex.`} onCancel={() => setConfirm(null)} onConfirm={deactivate} />}
  </div>;
}

function Field({ label, children }) { return <label className="form-field"><span>{label}</span>{children}</label>; }
