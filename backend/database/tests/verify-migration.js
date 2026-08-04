const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const requiredColumns = {
  users: ["last_name", "date_of_birth", "phone"],
  submissions: [
    "storage_key",
    "original_file_name",
    "stored_file_name",
    "file_extension",
    "mime_type",
    "file_size",
    "file_hash",
    "scan_status",
    "scan_result"
  ]
};

const requiredIndexes = [
  ["users", "email"],
  ["users", "idxUsersRoleStatus"],
  ["users", "idx_users_name"],
  ["users", "idx_users_last_name"],
  ["users", "idx_users_status"],
  ["submissions", "uqTaskStudent"],
  ["submissions", "idxSubmissionsStatus"],
  ["submissions", "idxSubmissionsGradedBy"],
  ["submissions", "idx_submissions_scan_status"],
  ["tasks", "idxTasksCourseStatus"],
  ["tasks", "idx_tasks_due_date"],
  ["tasks", "idx_tasks_status"],
  ["events", "idxEventsCourse"],
  ["events", "idx_events_start_date"],
  ["courseStudents", "uqCourseStudent"],
  ["courseStudents", "fkCourseStudentsStudent"],
  ["courseStudents", "idx_course_students_status"]
];

const requiredTriggers = [
  "bi_student_profiles_role",
  "bu_student_profiles_role",
  "bi_teacher_profiles_role",
  "bu_teacher_profiles_role",
  "bi_submissions_file_security",
  "bu_submissions_file_security",
  "bi_submissions_grader_teacher",
  "bu_submissions_grader_teacher"
];

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const expectDatabaseError = async (label, action) => {
  try {
    await action();
    throw new Error(`${label}: la base de datos acepto un valor invalido`);
  } catch (error) {
    if (error.message.endsWith("la base de datos acepto un valor invalido")) {
      throw error;
    }
    console.log(`PASS ${label}: ${error.message}`);
  }
};

const verifyStructure = async (db, database) => {
  const [tables] = await db.query(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('student_profiles', 'teacher_profiles')`,
    [database]
  );
  assert(tables.length === 2, "Faltan student_profiles o teacher_profiles");

  for (const [table, names] of Object.entries(requiredColumns)) {
    const [columns] = await db.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         AND COLUMN_NAME IN (${names.map(() => "?").join(", ")})`,
      [database, table, ...names]
    );
    assert(columns.length === names.length, `Faltan columnas requeridas en ${table}`);
  }

  const [gradeColumns] = await db.query(
    `SELECT COLUMN_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'submissions' AND COLUMN_NAME = 'grade'`,
    [database]
  );
  assert(gradeColumns[0]?.COLUMN_TYPE === "decimal(6,2)", "grade no es DECIMAL(6,2)");

  for (const [table, index] of requiredIndexes) {
    const [rows] = await db.query(
      `SELECT 1
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
       LIMIT 1`,
      [database, table, index]
    );
    assert(rows.length === 1, `Falta el indice ${table}.${index}`);
  }

  const [triggers] = await db.query(
    `SELECT TRIGGER_NAME
     FROM INFORMATION_SCHEMA.TRIGGERS
     WHERE TRIGGER_SCHEMA = ?
       AND TRIGGER_NAME IN (${requiredTriggers.map(() => "?").join(", ")})`,
    [database, ...requiredTriggers]
  );
  assert(triggers.length === requiredTriggers.length, "Faltan triggers de integridad");

  const [collations] = await db.query(
    `SELECT DISTINCT TABLE_COLLATION
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
    [database]
  );
  assert(
    collations.every((row) => row.TABLE_COLLATION.endsWith("_ci")),
    "La intercalacion debe permitir busquedas case-insensitive"
  );

  console.log("PASS estructura, indices, triggers y collation");
};

const verifyRules = async (db) => {
  const passwordHash = await bcrypt.hash("acadex-local-db-test", 4);
  await db.beginTransaction();

  try {
    const insertUser = async (name, email, role) => {
      const [result] = await db.query(
        `INSERT INTO users (name, last_name, email, role, status, password)
         VALUES (?, 'MigrationTest', ?, ?, 'active', ?)`,
        [name, email, role, passwordHash]
      );
      return result.insertId;
    };

    const teacherId = await insertUser("Teacher", "teacher.migration@test.local", "teacher");
    const studentId = await insertUser("Student", "student.migration@test.local", "student");
    const adminId = await insertUser("Admin", "admin.migration@test.local", "admin");

    await db.query(
      `INSERT INTO student_profiles
         (user_id, student_number, grade_level, section, academic_year)
       VALUES (?, 'STU-LOCAL-001', '5to Secundaria', 'A', '2026')`,
      [studentId]
    );
    await db.query(
      `INSERT INTO teacher_profiles (user_id, employee_number, subject_area)
       VALUES (?, 'DOC-LOCAL-001', 'Matematicas')`,
      [teacherId]
    );
    console.log("PASS perfiles validos por rol");

    await expectDatabaseError("perfil estudiantil con profesor", () =>
      db.query(
        `INSERT INTO student_profiles
           (user_id, student_number, grade_level, section, academic_year)
         VALUES (?, 'STU-LOCAL-INVALID', '5to Secundaria', 'A', '2026')`,
        [teacherId]
      )
    );
    await expectDatabaseError("perfil docente con estudiante", () =>
      db.query(
        `INSERT INTO teacher_profiles (user_id, employee_number, subject_area)
         VALUES (?, 'DOC-LOCAL-INVALID', 'Historia')`,
        [studentId]
      )
    );

    const [course] = await db.query(
      `INSERT INTO courses (name, description, teacherId, status)
       VALUES ('Curso local de migracion', 'Prueba aislada', ?, 'active')`,
      [teacherId]
    );
    await db.query(
      `INSERT INTO courseStudents (courseId, studentId, status)
       VALUES (?, ?, 'active')`,
      [course.insertId, studentId]
    );
    const [task] = await db.query(
      `INSERT INTO tasks
         (courseId, title, description, dueDate, maxScore, status, createdBy)
       VALUES (?, 'Tarea local', 'Prueba', '2026-08-15 23:59:00', 100, 'published', ?)`,
      [course.insertId, teacherId]
    );

    await db.query(
      `INSERT INTO events
         (courseId, eventType, startDate, endDate, createdBy, title)
       VALUES (?, 'class', '2026-08-10 10:00:00', '2026-08-10 11:00:00', ?, 'Evento local')`,
      [course.insertId, teacherId]
    );
    await expectDatabaseError("evento con rango de fechas invalido", () =>
      db.query(
        `INSERT INTO events
           (courseId, eventType, startDate, endDate, createdBy, title)
         VALUES (?, 'class', '2026-08-10 11:00:00', '2026-08-10 10:00:00', ?, 'Evento invalido')`,
        [course.insertId, teacherId]
      )
    );

    const validSubmission = {
      taskId: task.insertId,
      studentId,
      fileUrl: "/api/submissions/local/file",
      storageKey: "submissions/local/homework.pdf",
      originalName: "homework.pdf",
      storedName: "a1b2c3.pdf",
      extension: ".PDF",
      mimeType: "application/pdf",
      fileSize: 1024,
      fileHash: "a".repeat(64)
    };
    const insertSubmission = (overrides = {}) => {
      const value = { ...validSubmission, ...overrides };
      return db.query(
        `INSERT INTO submissions
           (taskId, studentId, fileUrl, storage_key, original_file_name,
            stored_file_name, file_extension, mime_type, file_size, file_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          value.taskId,
          value.studentId,
          value.fileUrl,
          value.storageKey,
          value.originalName,
          value.storedName,
          value.extension,
          value.mimeType,
          value.fileSize,
          value.fileHash
        ]
      );
    };

    await expectDatabaseError("archivo ejecutable", () =>
      insertSubmission({ extension: "exe", originalName: "malware.exe", storedName: "malware.exe" })
    );
    await expectDatabaseError("archivo con doble extension", () =>
      insertSubmission({ originalName: "homework.exe.pdf" })
    );
    await expectDatabaseError("MIME que no coincide", () =>
      insertSubmission({ mimeType: "application/octet-stream" })
    );
    await expectDatabaseError("storage_key publico", () =>
      insertSubmission({ storageKey: "https://public.example/homework.pdf" })
    );
    await expectDatabaseError("fileUrl publico", () =>
      insertSubmission({ fileUrl: "https://public.example/homework.pdf" })
    );

    const [submission] = await insertSubmission();
    const [[stored]] = await db.query(
      "SELECT file_extension FROM submissions WHERE id = ?",
      [submission.insertId]
    );
    assert(stored.file_extension === "pdf", "La extension no fue normalizada");
    console.log("PASS entrega PDF segura y extension normalizada");

    await db.query(
      `UPDATE submissions
       SET grade = 95, feedback = 'Correcto', gradedBy = ?
       WHERE id = ?`,
      [teacherId, submission.insertId]
    );
    console.log("PASS profesor asignado puede calificar dentro de maxScore");

    await expectDatabaseError("administrador como calificador", () =>
      db.query("UPDATE submissions SET gradedBy = ? WHERE id = ?", [adminId, submission.insertId])
    );
    await expectDatabaseError("calificacion mayor que maxScore", () =>
      db.query("UPDATE submissions SET grade = 101 WHERE id = ?", [submission.insertId])
    );
  } finally {
    await db.rollback();
  }
};

const main = async () => {
  const host = process.env.LOCAL_DB_HOST || "127.0.0.1";
  const allowedHosts = new Set(["127.0.0.1", "localhost", "::1"]);
  if (process.env.ACADEX_ALLOW_LOCAL_DB_TEST !== "1" || !allowedHosts.has(host)) {
    throw new Error(
      "Prueba cancelada: usa ACADEX_ALLOW_LOCAL_DB_TEST=1 y un host local"
    );
  }

  const database = process.env.LOCAL_DB_NAME || "acadex_local";
  const db = await mysql.createConnection({
    host,
    port: Number(process.env.LOCAL_DB_PORT || 33306),
    user: process.env.LOCAL_DB_USER || "root",
    password: process.env.LOCAL_DB_PASSWORD || "",
    database,
    timezone: "Z"
  });

  try {
    await db.query("SET SESSION time_zone = '+00:00'");
    await verifyStructure(db, database);
    await verifyRules(db);
    console.log("PASS migracion Acadex 20260801_001 verificada localmente");
  } finally {
    await db.end();
  }
};

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
