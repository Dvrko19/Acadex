# Esquema actual de Acadex

Inspeccion realizada el 1 de agosto de 2026 mediante consultas de solo lectura
a `INFORMATION_SCHEMA`. No se ejecuto DDL ni se modificaron datos en Railway.

## Motor y convenciones actuales

- MySQL 9.4.0.
- Base desplegada: `railway`.
- Motor de todas las tablas: InnoDB.
- Collation: `utf8mb4_0900_ai_ci` (case-insensitive y accent-insensitive).
- Zona del sistema MySQL: UTC.
- Zona de sesion observada: `SYSTEM`, que actualmente resuelve a UTC.
- Convencion existente: tablas y columnas principales en camelCase.

## Tablas actuales

### users

`id`, `name`, `email`, `role`, `status`, `password`, `createdAt`, `updatedAt`,
`deletedAt`.

- `email` ya es UNIQUE.
- `role` ya permite exactamente `admin`, `teacher` y `student`.
- Indice existente `(role, status)`.
- Faltan `last_name`, `date_of_birth` y `phone`.

### courses

`id`, `name`, `description`, `teacherId`, `status`, `createdAt`, `updatedAt`,
`deletedAt`.

- `teacherId` referencia `users.id`.
- Triggers existentes exigen que `teacherId` sea un profesor activo.

### courseStudents

`id`, `courseId`, `studentId`, `status`, `enrolledAt`, `createdAt`, `updatedAt`,
`registeredAt`, `deletedAt`.

- Es la tabla equivalente al modulo logico `enrollments`.
- UNIQUE existente en `(courseId, studentId)`.
- Relaciones existentes hacia `courses.id` y `users.id`.
- Triggers existentes exigen que `studentId` sea un estudiante activo.

### tasks

`id`, `courseId`, `title`, `description`, `dueDate`, `maxScore`, `status`,
`createdBy`, `createdAt`, `updatedAt`, `deletedAt`.

- `dueDate` ya es DATETIME, no VARCHAR.
- `maxScore` ya es DECIMAL(5,2).
- Relaciones existentes hacia curso y creador.
- Triggers existentes validan `maxScore` y la propiedad del curso.

### submissions

`id`, `taskId`, `studentId`, `fileUrl`, `grade`, `feedback`, `status`,
`gradedBy`, `gradedAt`, `submittedAt`, `updatedAt`, `deletedAt`.

- UNIQUE existente en `(taskId, studentId)`.
- `fileUrl` ya es VARCHAR(500).
- `grade`, `feedback`, `gradedBy` y `gradedAt` ya existen.
- `submittedAt` es TIMESTAMP; `gradedAt` es DATETIME.
- Triggers existentes validan matricula, rango de nota y propiedad del curso.
- Faltan los metadatos y el estado de escaneo del archivo.

### events

`id`, `courseId`, `eventType`, `startDate`, `endDate`, `location`, `meetingUrl`,
`userId`, `createdBy`, `title`, `description`, `data`, `createdAt`, `updatedAt`.

- `startDate` y `endDate` ya son DATETIME.
- Faltaba validar que `endDate` sea posterior a `startDate`.

### notifications

`id`, `userId`, `type`, `title`, `message`, `referenceId`, `referenceType`,
`isRead`, `readAt`, `createdAt`, `deletedAt`.

- Relacion existente hacia `users.id`.
- Indice existente `(userId, isRead)`.

## Mapeo sin duplicados

La migracion conserva los equivalentes existentes para no romper el backend:

| Nombre solicitado | Columna o tabla real conservada |
| --- | --- |
| `created_at`, `updated_at` en tablas existentes | `createdAt`, `updatedAt` |
| `task_id`, `student_id` | `taskId`, `studentId` |
| `file_url` | `fileUrl` |
| `submitted_at` | `submittedAt` |
| `graded_by`, `graded_at` | `gradedBy`, `gradedAt` |
| `tasks.due_date`, `tasks.max_score` | `dueDate`, `maxScore` |
| `events.start_date`, `events.end_date` | `startDate`, `endDate` |
| `enrollments` | `courseStudents` |

Los nombres snake_case se usan en las tablas nuevas y en los metadatos nuevos,
donde no existe un equivalente previo.

## Cambios de la migracion 20260801_001

- Agrega a `users`: `last_name`, `date_of_birth`, `phone` como NULL.
- Crea `student_profiles` y `teacher_profiles` con relaciones, UNIQUE y triggers
  de rol.
- Amplia `submissions` con metadatos de almacenamiento, hash y escaneo.
- Amplia `grade` a DECIMAL(6,2).
- Restringe extensiones a PDF/PPTX, MIME permitidos, doble extension, rutas
  publicas en `storage_key` y URLs no autenticadas en `fileUrl`.
- Exige que `gradedBy` sea el profesor asignado al curso.
- Agrega CHECK para nota no negativa, tamano positivo y rango de eventos.
- Agrega solamente los indices que no estaban ya cubiertos.

No se crean tablas de configuracion, reportes, perfiles generales ni una tabla
separada de calificaciones. La calificacion pertenece a `submissions`.

