const db = require("../config/db");
const eventBus = require("../events/eventBus");
const { AppError } = require("../helpers/errors");
const { serializeDateFields } = require("../helpers/dates");
const storageService = require("./private-storage.service");
const { validateStoredFile } = require("./file-validation.service");
const { createFileScanService } = require("./file-scan.service");

const fileScanService = createFileScanService();

const submissionSelect = `
  s.id,
  s.taskId,
  s.studentId,
  s.fileUrl,
  s.storage_key AS storageKey,
  s.original_file_name AS originalFileName,
  s.stored_file_name AS storedFileName,
  s.file_extension AS fileExtension,
  s.mime_type AS mimeType,
  s.file_size AS fileSize,
  s.file_hash AS fileHash,
  s.scan_status AS scanStatus,
  s.status,
  s.grade,
  s.feedback,
  s.gradedBy,
  s.gradedAt,
  s.submittedAt,
  s.updatedAt,
  t.title AS taskTitle,
  t.dueDate,
  t.maxScore,
  c.id AS courseId,
  c.name AS courseName,
  c.teacherId,
  u.name AS studentName,
  u.last_name AS studentLastName,
  TRIM(CONCAT_WS(' ', u.name, u.last_name)) AS studentFullName,
  u.email AS studentEmail
`;

const toApiSubmission = (submission) => serializeDateFields(submission, [
  "gradedAt",
  "submittedAt",
  "updatedAt",
  "dueDate"
]);

const mapSubmissions = (rows) => rows.map(toApiSubmission);

const findSubmissionByIdRaw = async (id) => {
  const [rows] = await db.query(
    `
    SELECT ${submissionSelect}
    FROM submissions s
    INNER JOIN tasks t ON s.taskId = t.id
    INNER JOIN courses c ON t.courseId = c.id
    INNER JOIN users u ON s.studentId = u.id
    WHERE s.id = ?
      AND s.deletedAt IS NULL
    `,
    [id]
  );
  return rows[0];
};

const findSubmissionById = async (id) => toApiSubmission(
  await findSubmissionByIdRaw(id)
);

const querySubmissions = async (whereSql = "", params = []) => {
  const [rows] = await db.query(
    `
    SELECT ${submissionSelect}
    FROM submissions s
    INNER JOIN tasks t ON s.taskId = t.id
    INNER JOIN courses c ON t.courseId = c.id
    INNER JOIN users u ON s.studentId = u.id
    WHERE s.deletedAt IS NULL
      ${whereSql}
    ORDER BY s.submittedAt DESC
    `,
    params
  );
  return mapSubmissions(rows);
};

const getSubmission = async () => querySubmissions();

const getSubmissionByTasks = async (taskId) => querySubmissions(
  "AND s.taskId = ?",
  [taskId]
);

const getSubmissionByStudents = async (studentId) => querySubmissions(
  "AND s.studentId = ?",
  [studentId]
);

const getSubmissionsForUser = async (user) => {
  if (user.role === "admin") return getSubmission();
  if (user.role === "teacher") {
    return querySubmissions("AND c.teacherId = ?", [user.userId]);
  }
  return getSubmissionByStudents(user.userId);
};

const getSubmissionsByStudentForUser = async (studentId, user) => {
  if (user.role === "student") {
    if (Number(studentId) !== Number(user.userId)) {
      throw new AppError(
        "No puedes consultar entregas de otro estudiante",
        403,
        "SUBMISSION_ACCESS_DENIED"
      );
    }
    return getSubmissionByStudents(studentId);
  }

  if (user.role === "teacher") {
    return querySubmissions(
      "AND s.studentId = ? AND c.teacherId = ?",
      [studentId, user.userId]
    );
  }

  return getSubmissionByStudents(studentId);
};

const getSubmissionsByTaskForReviewer = async (taskId, user, status) => {
  const [taskRows] = await db.query(
    `
    SELECT t.id, c.teacherId
    FROM tasks t
    INNER JOIN courses c ON t.courseId = c.id
    WHERE t.id = ?
      AND t.deletedAt IS NULL
      AND c.deletedAt IS NULL
    `,
    [taskId]
  );

  const task = taskRows[0];
  if (!task) throw new AppError("Tarea no encontrada", 404, "TASK_NOT_FOUND");
  if (user.role === "teacher" && Number(task.teacherId) !== Number(user.userId)) {
    throw new AppError(
      "No puedes consultar entregas de este curso",
      403,
      "SUBMISSION_ACCESS_DENIED"
    );
  }
  if (user.role === "student") {
    throw new AppError(
      "No tienes permisos para consultar entregas de la tarea",
      403,
      "SUBMISSION_ACCESS_DENIED"
    );
  }

  const allowedStatuses = ["pending", "submitted", "reviewed", "graded", "late"];
  const statusFilter = status && allowedStatuses.includes(status) ? status : null;
  return querySubmissions(
    `AND s.taskId = ? ${statusFilter ? "AND s.status = ?" : ""}`,
    statusFilter ? [taskId, statusFilter] : [taskId]
  );
};

const findStudentSubmissionForTask = async ({ taskId, studentId }) => {
  const [rows] = await db.query(
    `SELECT * FROM submissions
     WHERE taskId = ? AND studentId = ? AND deletedAt IS NULL`,
    [taskId, studentId]
  );
  return rows[0];
};

const getTaskForSubmission = async (taskId) => {
  const [rows] = await db.query(
    `
    SELECT t.id, t.courseId, t.title, t.dueDate, t.maxScore,
           c.teacherId, c.name AS courseName
    FROM tasks t
    INNER JOIN courses c ON t.courseId = c.id
    WHERE t.id = ?
      AND t.deletedAt IS NULL
      AND t.status = 'published'
      AND c.deletedAt IS NULL
      AND c.status = 'active'
    `,
    [taskId]
  );
  return rows[0];
};

const assertStudentCanSubmitTask = async ({ taskId, studentId }) => {
  const task = await getTaskForSubmission(taskId);
  if (!task) throw new AppError("Tarea no encontrada", 404, "TASK_NOT_FOUND");

  const [enrollments] = await db.query(
    `
    SELECT id FROM courseStudents
    WHERE courseId = ? AND studentId = ?
      AND status = 'active' AND deletedAt IS NULL
    `,
    [task.courseId, studentId]
  );
  if (enrollments.length === 0) {
    throw new AppError(
      "No estas matriculado en el curso de esta tarea",
      403,
      "COURSE_ENROLLMENT_REQUIRED"
    );
  }
  return task;
};

const updateScanStatus = async (submissionId, status, result = null, storageKey) => {
  const storageUpdate = storageKey ? ", storage_key = ?" : "";
  const params = storageKey
    ? [status, result, storageKey, submissionId]
    : [status, result, submissionId];
  await db.query(
    `UPDATE submissions
     SET scan_status = ?, scan_result = ?${storageUpdate}
     WHERE id = ?`,
    params
  );
};

const scanSubmission = async (submissionId, file, previousStorageKey = null) => {
  await updateScanStatus(submissionId, "scanning");

  try {
    const scan = await fileScanService.scanFile(file.path);
    if (scan.status === "infected") {
      await storageService.removeAbsolute(file.path);
      await updateScanStatus(submissionId, "infected", scan.result || "Archivo rechazado por la validacion automatica");
      eventBus.emit("FILE_SCAN_REJECTED", { submissionId });
    } else {
      const cleanStorageKey = await storageService.promote(file.filename);
      await updateScanStatus(submissionId, "clean", null, cleanStorageKey);
    }
  } catch (error) {
    console.error("File scan failed", {
      submissionId,
      message: error.message
    });
    await updateScanStatus(submissionId, "scan_failed", "Analisis no disponible");
  }

  if (previousStorageKey) {
    await storageService.remove(previousStorageKey);
  }

  return findSubmissionById(submissionId);
};

const buildFileMetadata = async (file) => {
  const validated = await validateStoredFile(file);
  return {
    storageKey: storageService.quarantineKey(file.filename),
    originalFileName: file.originalname,
    storedFileName: file.filename,
    fileExtension: validated.extension,
    mimeType: validated.mimeType,
    fileSize: file.size,
    fileHash: validated.fileHash
  };
};

const createSubmission = async ({ taskId, studentId, file }) => {
  let submissionId;
  try {
    const task = await assertStudentCanSubmitTask({ taskId, studentId });
    if (await findStudentSubmissionForTask({ taskId, studentId })) {
      throw new AppError(
        "Este estudiante ya entrego la tarea",
        409,
        "SUBMISSION_ALREADY_EXISTS"
      );
    }

    const metadata = await buildFileMetadata(file);
    const status = Date.now() > new Date(task.dueDate).getTime() ? "late" : "submitted";
    const [result] = await db.query(
      `
      INSERT INTO submissions
        (taskId, studentId, fileUrl, storage_key, original_file_name,
         stored_file_name, file_extension, mime_type, file_size, file_hash,
         scan_status, status, submittedAt)
      VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, UTC_TIMESTAMP())
      `,
      [
        taskId,
        studentId,
        metadata.storageKey,
        metadata.originalFileName,
        metadata.storedFileName,
        metadata.fileExtension,
        metadata.mimeType,
        metadata.fileSize,
        metadata.fileHash,
        status
      ]
    );
    submissionId = result.insertId;
    await db.query(
      "UPDATE submissions SET fileUrl = ? WHERE id = ?",
      [`/api/submissions/${submissionId}/file`, submissionId]
    );

    const submission = await scanSubmission(submissionId, file);
    eventBus.emit("SUBMISSION_CREATED", submission);
    return submission;
  } catch (error) {
    if (!submissionId && file?.path) {
      await storageService.removeAbsolute(file.path).catch(() => {});
    }
    throw error;
  }
};

const replaceSubmission = async (id, { file }, user) => {
  const current = await findSubmissionByIdRaw(id);
  if (!current) throw new AppError("Entrega no encontrada", 404, "SUBMISSION_NOT_FOUND");
  if (user.role !== "student" || Number(current.studentId) !== Number(user.userId)) {
    throw new AppError(
      "Solo puedes reemplazar tu propia entrega",
      403,
      "SUBMISSION_ACCESS_DENIED"
    );
  }
  if (current.status === "graded") {
    throw new AppError(
      "No puedes reemplazar una entrega calificada",
      409,
      "GRADED_SUBMISSION_LOCKED"
    );
  }

  try {
    const metadata = await buildFileMetadata(file);
    const status = Date.now() > new Date(current.dueDate).getTime() ? "late" : "submitted";
    await db.query(
      `
      UPDATE submissions
      SET storage_key = ?, original_file_name = ?, stored_file_name = ?,
          file_extension = ?, mime_type = ?, file_size = ?, file_hash = ?,
          scan_status = 'pending', scan_result = NULL, status = ?,
          submittedAt = UTC_TIMESTAMP()
      WHERE id = ?
      `,
      [
        metadata.storageKey,
        metadata.originalFileName,
        metadata.storedFileName,
        metadata.fileExtension,
        metadata.mimeType,
        metadata.fileSize,
        metadata.fileHash,
        status,
        id
      ]
    );

    const submission = await scanSubmission(id, file, current.storageKey);
    eventBus.emit("SUBMISSION_UPDATED", submission);
    return submission;
  } catch (error) {
    if (file?.path) await storageService.removeAbsolute(file.path).catch(() => {});
    throw error;
  }
};

const assertCanDownload = (submission, user) => {
  if (user.role === "admin") return;
  if (user.role === "student" && Number(submission.studentId) === Number(user.userId)) return;
  if (user.role === "teacher" && Number(submission.teacherId) === Number(user.userId)) return;
  throw new AppError(
    "No tienes permisos para acceder a este archivo",
    403,
    "SUBMISSION_FILE_ACCESS_DENIED"
  );
};

const getSubmissionFile = async (submissionId, user) => {
  const submission = await findSubmissionByIdRaw(submissionId);
  if (!submission) throw new AppError("Entrega no encontrada", 404, "SUBMISSION_NOT_FOUND");
  assertCanDownload(submission, user);
  if (submission.scanStatus !== "clean") {
    throw new AppError(
      "El archivo todavia no esta disponible para descarga.",
      409,
      "FILE_NOT_CLEAN"
    );
  }
  if (!submission.storageKey || !(await storageService.exists(submission.storageKey))) {
    throw new AppError(
      "El archivo de la entrega ya no esta disponible.",
      404,
      "SUBMISSION_FILE_NOT_FOUND"
    );
  }

  return {
    stream: storageService.createReadStream(submission.storageKey),
    mimeType: submission.mimeType,
    fileExtension: submission.fileExtension,
    originalFileName: submission.originalFileName
  };
};

const gradeSubmission = async (submissionId, { grade, feedback }, user) => {
  const submission = await findSubmissionByIdRaw(submissionId);
  if (!submission) throw new AppError("Entrega no encontrada", 404, "SUBMISSION_NOT_FOUND");
  if (user.role !== "teacher" || Number(submission.teacherId) !== Number(user.userId)) {
    throw new AppError(
      "Solo el profesor del curso puede calificar esta entrega",
      403,
      "SUBMISSION_GRADE_DENIED"
    );
  }

  const numericGrade = Number(grade);
  if (!Number.isFinite(numericGrade) || numericGrade < 0 || numericGrade > Number(submission.maxScore)) {
    throw new AppError(
      "La nota debe estar entre cero y el puntaje maximo de la tarea",
      400,
      "INVALID_GRADE"
    );
  }
  if (feedback && feedback.length > 1000) {
    throw new AppError("El comentario es demasiado largo", 400, "INVALID_FEEDBACK");
  }

  await db.query(
    `UPDATE submissions
     SET grade = ?, feedback = ?, status = 'graded', gradedBy = ?, gradedAt = UTC_TIMESTAMP()
     WHERE id = ?`,
    [numericGrade, feedback || null, user.userId, submissionId]
  );
  const graded = await findSubmissionById(submissionId);
  eventBus.emit("SUBMISSION_GRADED", graded);
  return graded;
};

const deleteSubmission = async (id, user) => {
  const submission = await findSubmissionByIdRaw(id);
  if (!submission) throw new AppError("Entrega no encontrada", 404, "SUBMISSION_NOT_FOUND");
  if (user.role === "teacher" && Number(submission.teacherId) !== Number(user.userId)) {
    throw new AppError(
      "No puedes eliminar entregas de otro curso",
      403,
      "SUBMISSION_ACCESS_DENIED"
    );
  }

  await db.query(
    "UPDATE submissions SET deletedAt = UTC_TIMESTAMP() WHERE id = ? AND deletedAt IS NULL",
    [id]
  );
  await storageService.remove(submission.storageKey);
  eventBus.emit("SUBMISSION_DELETED", { id });
  return { id };
};

module.exports = {
  findSubmissionById,
  getSubmission,
  getSubmissionsForUser,
  getSubmissionByStudents,
  getSubmissionsByStudentForUser,
  getSubmissionsByTaskForReviewer,
  findStudentSubmissionForTask,
  createSubmission,
  replaceSubmission,
  getSubmissionFile,
  gradeSubmission,
  deleteSubmission,
  getSubmissionByTasks,
  assertStudentCanSubmitTask
};
