import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Search,
  X
} from "lucide-react";

const statusLabels = {
  active: "Activo",
  inactive: "Inactivo",
  published: "Publicada",
  draft: "Borrador",
  closed: "Cerrada",
  submitted: "Esperando revision",
  pending: "Pendiente",
  reviewed: "Revisada",
  graded: "Tarea calificada",
  late: "Entrega tardia",
  completed: "Completada",
  clean: "Archivo validado",
  scanning: "Validando archivo",
  infected: "Archivo rechazado",
  scan_failed: "Revision no completada"
};

export function StatCard({ label, value, tone = "blue", icon: Icon }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-icon" aria-hidden="true">{Icon ? <Icon size={20} /> : null}</div>
      <div><span>{label}</span><strong>{value ?? 0}</strong></div>
    </article>
  );
}

export function StatusBadge({ value }) {
  const normalized = String(value || "pending").toLowerCase();
  return <span className={`status-badge status-${normalized}`}>{statusLabels[normalized] || value || "Pendiente"}</span>;
}

export function ScanStatusBadge({ value }) {
  const normalized = String(value || "pending").toLowerCase();
  return (
    <span className={`status-badge scan-${normalized}`}>
      {normalized === "clean" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      {statusLabels[normalized] || "Esperando analisis"}
    </span>
  );
}

export function EmptyState({ title = "Aun no hay informacion", message = "Cuando haya novedades apareceran aqui.", action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true"><Inbox size={28} /></span>
      <strong>{title}</strong><p>{message}</p>{action}
    </div>
  );
}

export function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="skeleton-list" aria-label="Cargando informacion" aria-busy="true">
      {Array.from({ length: rows }, (_, index) => <span className="skeleton-row" key={index} />)}
    </div>
  );
}

export function ErrorAlert({ message }) {
  if (!message) return null;
  return <div className="alert error-alert" role="alert"><AlertCircle size={18} /><span>{message}</span></div>;
}

export const ErrorMessage = ErrorAlert;

export function SuccessMessage({ message }) {
  if (!message) return null;
  return <div className="alert success-alert" role="status"><CheckCircle2 size={18} /><span>{message}</span></div>;
}

export function SearchInput({ value, onChange, placeholder = "Buscar...", label = "Buscar" }) {
  return (
    <label className="filter-control search-control">
      <span>{label}</span>
      <div className="input-with-icon"><Search size={17} aria-hidden="true" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></div>
    </label>
  );
}

export function SelectFilter({ label, value, onChange, options, allLabel = "Todos" }) {
  return (
    <label className="filter-control"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{allLabel}</option>
      {options.map((option) => <option key={option.value ?? option} value={option.value ?? option}>{option.label ?? option}</option>)}
    </select></label>
  );
}

export function CourseSelector({ courses, value, onChange, label = "Curso", allowGeneral = false }) {
  return (
    <label className="form-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} required={!allowGeneral}>
      <option value="">{allowGeneral ? "Evento general" : "Seleccionar curso"}</option>
      {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
    </select></label>
  );
}

export function DateTimeField({ label, value, onChange, required = false, min }) {
  return <label className="form-field"><span>{label}</span><input type="datetime-local" value={value} min={min} required={required} onChange={(event) => onChange(event.target.value)} /></label>;
}

export function DataTable({ columns, rows, actions, emptyMessage, rowKey = (row) => row.id }) {
  if (!rows.length) return <EmptyState message={emptyMessage} />;
  return (
    <div className="table-shell"><table><thead><tr>
      {columns.map((column) => <th key={column.key}>{column.label}</th>)}{actions && <th>Acciones</th>}
    </tr></thead><tbody>{rows.map((row, index) => <tr key={rowKey(row) ?? index}>
      {columns.map((column) => <td data-label={column.label} key={column.key}>{column.render ? column.render(row) : (row[column.key] ?? "-")}</td>)}
      {actions && <td data-label="Acciones">{actions(row)}</td>}
    </tr>)}</tbody></table></div>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return <nav className="pagination" aria-label="Paginacion">
    <button className="icon-button" type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Pagina anterior"><ChevronLeft size={18} /></button>
    <span>Pagina {page} de {totalPages}</span>
    <button className="icon-button" type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Pagina siguiente"><ChevronRight size={18} /></button>
  </nav>;
}

export function Modal({ title, children, onClose, wide = false }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className={`modal-panel ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-header"><h2>{title}</h2><button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button></header>
      {children}
    </section>
  </div>;
}

export function ConfirmDialog({ title, message, onCancel, onConfirm }) {
  return <Modal title={title} onClose={onCancel}><p className="dialog-message">{message}</p><div className="form-actions end">
    <button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button>
    <button className="danger-button" type="button" onClick={onConfirm}>Confirmar</button>
  </div></Modal>;
}
