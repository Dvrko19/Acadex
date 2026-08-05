import { useCallback, useMemo, useState } from "react";
import { Download, Eye, FileCheck2, Pencil, Send } from "lucide-react";

import { FileTypeBadge, FileUpload } from "../../components/FileUpload";
import { UserSearchAutocomplete } from "../../components/UserSearchAutocomplete";
import { CourseSelector, DataTable, EmptyState, ErrorAlert, LoadingSkeleton, Modal, Pagination, ScanStatusBadge, SearchInput, SelectFilter, StatusBadge, SuccessMessage } from "../../components/ui";
import { useAsyncResource } from "../../hooks/useAsyncResource";
import { apiMessage } from "../../services/api";
import { courseService } from "../../services/courseService";
import { submissionService } from "../../services/submissionService";
import { taskService } from "../../services/taskService";
import { formatDateTime } from "../../utils/dateTime";
import { formatFileSize } from "../../utils/file";

const scanMessages = {
  pending: "El archivo esta esperando validacion automatica.",
  scanning: "El archivo esta siendo validado.",
  infected: "El archivo fue rechazado por la validacion automatica.",
  scan_failed: "La revision automatica no pudo completarse. El archivo permanece aislado; reemplazalo o vuelve a enviarlo mas tarde.",
  clean: "El archivo esta disponible para revision."
};

export function SubmissionsModule({ user }) {
  const load = useCallback(async () => { const [courses, tasks, submissions] = await Promise.all([courseService.myCourses(), taskService.list(), user.role === "student" ? submissionService.mySubmissions() : submissionService.list()]); return { courses, tasks, submissions }; }, [user.role]);
  const { data, error: loadError, loading, reload } = useAsyncResource(load, "No se pudieron cargar las entregas.");
  const courses = data?.courses || []; const tasks = data?.tasks || []; const submissions = useMemo(() => data?.submissions || [], [data?.submissions]);
  const [query, setQuery] = useState(""); const [courseFilter, setCourseFilter] = useState(""); const [taskFilter, setTaskFilter] = useState(""); const [scanFilter, setScanFilter] = useState(""); const [studentFilter, setStudentFilter] = useState(null); const [page, setPage] = useState(1);
  const [upload, setUpload] = useState(null); const [file, setFile] = useState(null); const [progress, setProgress] = useState(0); const [gradeTarget, setGradeTarget] = useState(null); const [grade, setGrade] = useState(""); const [feedback, setFeedback] = useState(""); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");

  const pendingTasks = tasks.filter((item) => !item.submissionId);
  const filtered = useMemo(() => submissions.filter((item) => `${item.taskTitle} ${item.courseName} ${item.studentFullName || item.studentName || ""} ${item.studentEmail || ""}`.toLowerCase().includes(query.toLowerCase()) && (!courseFilter || Number(item.courseId) === Number(courseFilter)) && (!taskFilter || Number(item.taskId) === Number(taskFilter)) && (!scanFilter || item.scanStatus === scanFilter) && (!studentFilter || Number(item.studentId) === Number(studentFilter.id))), [courseFilter, query, scanFilter, studentFilter, submissions, taskFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 7)); const rows = filtered.slice((page - 1) * 7, page * 7);

  const sendFile = async (event) => {
    event.preventDefault(); if (!file || (!upload?.taskId && !upload?.id)) return setError("Selecciona una tarea y un archivo.");
    setSaving(true); setProgress(0); setError(""); setMessage("");
    try {
      const submission = upload.id
        ? await submissionService.update(upload.id, { file, onProgress: setProgress })
        : await submissionService.create({ taskId: upload.taskId, file, onProgress: setProgress });
      if (submission.scanStatus === "clean") {
        setMessage("Archivo entregado y validado correctamente.");
      } else if (submission.scanStatus === "infected") {
        setError("La validacion automatica rechazo el archivo. Reemplazalo por otra version.");
      } else if (submission.scanStatus === "scan_failed") {
        setError("Entrega recibida, pero la revision automatica no pudo completarse. El archivo permanece aislado.");
      } else {
        setMessage("Archivo entregado. La revision automatica esta en curso.");
      }
      setUpload(null); setFile(null); reload();
    } catch (uploadError) { setError(apiMessage(uploadError, "No se pudo entregar el archivo.")); } finally { setSaving(false); }
  };
  const openFile = async (item) => { setError(""); try { await submissionService.openFile(item); } catch (fileError) { setError(apiMessage(fileError, "No se pudo abrir el archivo.")); } };
  const submitGrade = async (event) => {
    event.preventDefault(); const numericGrade = Number(grade);
    if (Number.isNaN(numericGrade) || numericGrade < 0 || numericGrade > Number(gradeTarget.maxScore)) return setError(`La calificacion debe estar entre 0 y ${gradeTarget.maxScore}.`);
    setSaving(true); setError("");
    try { await submissionService.grade(gradeTarget.id, { grade: numericGrade, feedback: feedback.trim() || null }); setMessage("Entrega calificada correctamente."); setGradeTarget(null); reload(); } catch (gradeError) { setError(apiMessage(gradeError, "No se pudo guardar la calificacion.")); } finally { setSaving(false); }
  };

  return <div className="module-stack">
    <div className="module-heading"><div><h2>{user.role === "student" ? "Mis entregas" : "Revision de entregas"}</h2><p>{user.role === "student" ? "Consulta tus archivos, su validacion automatica y los comentarios de tus profesores." : "Revisa solamente archivos validados y registra una retroalimentacion clara."}</p></div>{user.role === "student" && pendingTasks.length > 0 && <button type="button" onClick={() => { setUpload({ taskId: "" }); setFile(null); }}><Send size={18} />Nueva entrega</button>}</div>
    <ErrorAlert message={error || loadError} /><SuccessMessage message={message} />
    <section className="panel"><div className="toolbar"><SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Buscar tarea, curso o estudiante" />{user.role === "teacher" && <UserSearchAutocomplete label="Filtrar estudiante" role="student" value={studentFilter} onChange={(value) => { setStudentFilter(value); setPage(1); }} />}<SelectFilter label="Curso" value={courseFilter} onChange={(value) => { setCourseFilter(value); setPage(1); }} options={courses.map((item) => ({ value: item.id, label: item.name }))} /><SelectFilter label="Tarea" value={taskFilter} onChange={(value) => { setTaskFilter(value); setPage(1); }} options={tasks.filter((item) => !courseFilter || Number(item.courseId) === Number(courseFilter)).map((item) => ({ value: item.id, label: item.title }))} /><SelectFilter label="Validacion" value={scanFilter} onChange={(value) => { setScanFilter(value); setPage(1); }} options={[{ value: "pending", label: "Esperando" }, { value: "scanning", label: "Validando" }, { value: "clean", label: "Validado" }, { value: "infected", label: "Rechazado" }, { value: "scan_failed", label: "Revision no completada" }]} /></div>
      {loading ? <LoadingSkeleton /> : rows.length ? <DataTable columns={user.role === "student" ? studentColumns : teacherColumns(studentFilter)} rows={rows} actions={(item) => <SubmissionActions item={item} role={user.role} onOpen={openFile} onReplace={() => { setUpload(item); setFile(null); setProgress(0); }} onGrade={() => { setGradeTarget(item); setGrade(item.grade ?? ""); setFeedback(item.feedback || ""); }} />} /> : <EmptyState message="No hay entregas con esos filtros." />}
      <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} onChange={setPage} /></section>
    {upload && <Modal title={upload.id ? "Reemplazar archivo" : "Nueva entrega"} onClose={() => !saving && setUpload(null)} wide><form className="upload-form" onSubmit={sendFile}>{!upload.id && <CourseTaskPicker courses={courses} tasks={pendingTasks} courseId={upload.courseId || ""} taskId={upload.taskId || ""} onChange={setUpload} />}<FileUpload file={file} onChange={setFile} progress={progress} uploading={saving} /><div className="form-actions end"><button className="secondary-button" type="button" disabled={saving} onClick={() => setUpload(null)}>Cancelar</button><button type="submit" disabled={saving || !file || (!upload.id && !upload.taskId)}>{saving ? "Subiendo archivo..." : "Entregar tarea"}</button></div></form></Modal>}
    {gradeTarget && <Modal title={`Calificar: ${gradeTarget.taskTitle}`} onClose={() => !saving && setGradeTarget(null)}><form className="form-grid single" onSubmit={submitGrade}><Field label={`Calificacion (maximo ${gradeTarget.maxScore})`}><input type="number" min="0" max={gradeTarget.maxScore} step="0.01" value={grade} onChange={(event) => setGrade(event.target.value)} required /></Field><Field label="Retroalimentacion"><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Escribe un comentario que ayude al estudiante a mejorar." /></Field><div className="form-actions end"><button className="secondary-button" type="button" onClick={() => setGradeTarget(null)}>Cancelar</button><button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar calificacion"}</button></div></form></Modal>}
  </div>;
}

const studentColumns = [
  { key: "taskTitle", label: "Tarea", render: (item) => <div className="primary-cell"><strong>{item.taskTitle}</strong><small>{item.courseName}</small></div> },
  { key: "file", label: "Archivo", render: (item) => <div className="primary-cell"><span>{item.originalFileName || "Archivo entregado"}</span><small><FileTypeBadge submission={item} /> {formatFileSize(item.fileSize)}</small></div> },
  { key: "submittedAt", label: "Fecha de entrega", render: (item) => formatDateTime(item.submittedAt) },
  { key: "scanStatus", label: "Validacion del archivo", render: (item) => <div className="primary-cell"><ScanStatusBadge value={item.scanStatus} /><small>{scanMessages[item.scanStatus]}</small></div> },
  { key: "status", label: "Estado academico", render: (item) => <StatusBadge value={item.status} /> },
  { key: "grade", label: "Calificacion", render: (item) => <div className="primary-cell"><strong>{item.grade ?? "Sin calificar"}{item.grade != null ? ` / ${item.maxScore}` : ""}</strong>{item.feedback && <small>El profesor dejo un comentario: {item.feedback}</small>}</div> }
];

const teacherColumns = (selectedStudent) => [
  { key: "student", label: "Estudiante", render: (item) => <div className="primary-cell"><strong>{item.studentFullName || `${item.studentName || ""} ${item.studentLastName || ""}`}</strong><small>{item.studentEmail}</small><small>{item.gradeLevel || selectedStudent?.gradeLevel || "Grado no registrado"} · Seccion {item.section || selectedStudent?.section || "-"}</small></div> },
  { key: "task", label: "Curso y tarea", render: (item) => <div className="primary-cell"><strong>{item.taskTitle}</strong><small>{item.courseName}</small></div> },
  { key: "file", label: "Archivo", render: (item) => <div className="primary-cell"><span>{item.originalFileName || "Archivo"}</span><small><FileTypeBadge submission={item} /> {formatFileSize(item.fileSize)}</small></div> },
  { key: "submittedAt", label: "Entrega", render: (item) => <div className="primary-cell"><span>{formatDateTime(item.submittedAt)}</span><small>{new Date(item.submittedAt) > new Date(item.dueDate) ? "Entregada tarde" : "Entregada a tiempo"}</small></div> },
  { key: "scanStatus", label: "Validacion", render: (item) => <div className="primary-cell"><ScanStatusBadge value={item.scanStatus} /><small>{scanMessages[item.scanStatus]}</small></div> },
  { key: "grade", label: "Calificacion", render: (item) => <div className="primary-cell"><strong>{item.grade ?? "Pendiente"}{item.grade != null ? ` / ${item.maxScore}` : ""}</strong><small>{item.feedback || "Sin retroalimentacion"}</small></div> }
];

function SubmissionActions({ item, role, onOpen, onReplace, onGrade }) {
  const clean = item.scanStatus === "clean";
  const isPdf = item.mimeType === "application/pdf" || item.fileExtension === ".pdf";
  return <div className="row-actions"><button className="icon-text-button" type="button" disabled={!clean} onClick={() => onOpen(item)} title={clean ? "Abrir archivo" : scanMessages[item.scanStatus]}>{isPdf ? <Eye size={16} /> : <Download size={16} />}{isPdf ? "Ver PDF" : "Descargar PowerPoint"}</button>{role === "student" ? <button className="icon-text-button" type="button" onClick={onReplace}><Pencil size={16} />Reemplazar</button> : <button className="icon-text-button" type="button" disabled={!clean} onClick={onGrade}><FileCheck2 size={16} />Calificar</button>}</div>;
}

function CourseTaskPicker({ courses, tasks, courseId, taskId, onChange }) {
  return <div className="form-grid"><CourseSelector courses={courses} value={courseId} onChange={(value) => onChange((current) => ({ ...current, courseId: value, taskId: "" }))} /><Field label="Tarea"><select value={taskId} onChange={(event) => onChange((current) => ({ ...current, taskId: event.target.value }))} required><option value="">Seleccionar tarea</option>{tasks.filter((item) => !courseId || Number(item.courseId) === Number(courseId)).map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></Field></div>;
}

function Field({ label, children }) { return <label className="form-field"><span>{label}</span>{children}</label>; }
