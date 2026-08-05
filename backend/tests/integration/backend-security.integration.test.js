const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const request = require("supertest");

process.env.NODE_ENV = "test";
process.env.FILE_SCAN_PROVIDER = "test";
process.env.APP_TIMEZONE = "UTC";
process.env.JWT_SECRET = "acadex-integration-test-secret";
process.env.DB_HOST = process.env.LOCAL_DB_HOST || "127.0.0.1";
process.env.DB_PORT = process.env.LOCAL_DB_PORT || "33306";
process.env.DB_USER = process.env.LOCAL_DB_USER || "root";
process.env.DB_PASSWORD = process.env.LOCAL_DB_PASSWORD || "";
process.env.DB_NAME = process.env.LOCAL_DB_NAME || "acadex_backend_test";
process.env.DATABASE_URL = "";
process.env.PRIVATE_UPLOAD_DIRECTORY = path.resolve(
  process.env.LOCAL_PRIVATE_UPLOAD_DIRECTORY || "private-uploads-integration-test"
);

const { app } = require("../../index");
const db = require("../../src/config/db");

const tokenFor = (user) => jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "10m" }
);

const pdf = (marker = "clean") => Buffer.from(
  `%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n${marker}\n%%EOF`
);

const uploadPdf = (token, taskId, body = pdf(), fileName = "tarea.pdf", mime = "application/pdf") =>
  request(app)
    .post("/api/submissions")
    .set("Authorization", `Bearer ${token}`)
    .field("taskId", String(taskId))
    .attach("file", body, { filename: fileName, contentType: mime });

test("backend academico seguro", async (suite) => {
  const passwordHash = await bcrypt.hash("integration-test", 4);
  const insertUser = async (name, lastName, email, role) => {
    const [result] = await db.query(
      `INSERT INTO users
         (name, last_name, email, role, status, password)
       VALUES (?, ?, ?, ?, 'active', ?)`,
      [name, lastName, email, role, passwordHash]
    );
    return { id: result.insertId, role, name, lastName, email };
  };

  const admin = await insertUser("Admin", "Local", "admin@test.local", "admin");
  const teacherA = await insertUser("Carlos", "Gomez", "carlos@test.local", "teacher");
  const teacherB = await insertUser("Laura", "Martinez", "laura@test.local", "teacher");
  const studentA = await insertUser("Ana", "Rodriguez", "ana@test.local", "student");
  const studentB = await insertUser("Juan", "Perez", "juan@test.local", "student");

  await db.query(
    `INSERT INTO teacher_profiles (user_id, employee_number, subject_area)
     VALUES (?, 'DOC-A', 'Matematicas'), (?, 'DOC-B', 'Historia')`,
    [teacherA.id, teacherB.id]
  );
  await db.query(
    `INSERT INTO student_profiles
       (user_id, student_number, grade_level, section, academic_year)
     VALUES (?, 'EST-A', '4to de secundaria', 'A', '2026'),
            (?, 'EST-B', '4to de secundaria', 'B', '2026')`,
    [studentA.id, studentB.id]
  );

  const [courseAResult] = await db.query(
    "INSERT INTO courses (name, teacherId, status) VALUES ('Curso A', ?, 'active')",
    [teacherA.id]
  );
  const [courseBResult] = await db.query(
    "INSERT INTO courses (name, teacherId, status) VALUES ('Curso B', ?, 'active')",
    [teacherB.id]
  );
  const courseA = courseAResult.insertId;
  const courseB = courseBResult.insertId;
  await db.query(
    `INSERT INTO courseStudents (courseId, studentId, status)
     VALUES (?, ?, 'active'), (?, ?, 'active'), (?, ?, 'active')`,
    [courseA, studentA.id, courseA, studentB.id, courseB, studentB.id]
  );

  const insertTask = async (courseId, teacherId, title) => {
    const [result] = await db.query(
      `INSERT INTO tasks
         (courseId, title, dueDate, maxScore, status, createdBy)
       VALUES (?, ?, '2026-12-31 23:59:00', 100, 'published', ?)`,
      [courseId, title, teacherId]
    );
    return result.insertId;
  };
  const cleanTaskA = await insertTask(courseA, teacherA.id, "Entrega limpia A");
  const infectedTaskA = await insertTask(courseA, teacherA.id, "Entrega infectada A");
  const pendingTaskA = await insertTask(courseA, teacherA.id, "Entrega pendiente A");
  const otherStudentTaskA = await insertTask(courseA, teacherA.id, "Entrega otro estudiante");
  const cleanTaskB = await insertTask(courseB, teacherB.id, "Entrega limpia B");

  const tokens = {
    admin: tokenFor(admin),
    teacherA: tokenFor(teacherA),
    teacherB: tokenFor(teacherB),
    studentA: tokenFor(studentA),
    studentB: tokenFor(studentB)
  };

  await suite.test("guarda una fecha ISO como UTC en MySQL", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokens.teacherA}`)
      .send({
        courseId: courseA,
        title: "Fecha ISO",
        dueDate: "2026-08-01T21:03:00.000-04:00"
      });
    assert.equal(response.status, 201, JSON.stringify(response.body));
    const [[stored]] = await db.query(
      "SELECT DATE_FORMAT(dueDate, '%Y-%m-%d %H:%i:%s') AS dueDate FROM tasks WHERE id = ?",
      [response.body.data.id]
    );
    assert.equal(stored.dueDate, "2026-08-02 01:03:00");
    assert.equal(response.body.data.dueDate, "2026-08-02T01:03:00.000Z");
  });

  await suite.test("rechaza endDate anterior a startDate", async () => {
    const response = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${tokens.teacherA}`)
      .send({
        courseId: courseA,
        eventType: "class",
        startDate: "2026-08-02T10:00:00.000Z",
        endDate: "2026-08-02T09:00:00.000Z"
      });
    assert.equal(response.status, 400);
    assert.equal(response.body.code, "INVALID_DATE_RANGE");
  });

  await suite.test("rechaza un ejecutable renombrado a PDF", async () => {
    const executable = await uploadPdf(tokens.studentA, cleanTaskA, Buffer.from("MZ executable"));
    assert.equal(executable.status, 400);
    assert.equal(executable.body.code, "INVALID_FILE_SIGNATURE");
  });

  await suite.test("rechaza un archivo con MIME incorrecto", async () => {
    const wrongMime = await uploadPdf(
      tokens.studentA,
      cleanTaskA,
      pdf(),
      "tarea.pdf",
      "application/octet-stream"
    );
    assert.equal(wrongMime.status, 400);
    assert.equal(wrongMime.body.code, "INVALID_FILE_MIME");
  });

  let cleanA;
  let infectedA;
  let otherStudentA;
  let cleanB;

  await suite.test("crea PDF limpio e infectado con estados fail-closed", async () => {
    const clean = await uploadPdf(tokens.studentA, cleanTaskA);
    assert.equal(clean.status, 201, JSON.stringify(clean.body));
    assert.equal(clean.body.data.scanStatus, "clean");
    cleanA = clean.body.data;

    const infected = await uploadPdf(
      tokens.studentA,
      infectedTaskA,
      pdf("EICAR-TEST-FILE")
    );
    assert.equal(infected.status, 201, JSON.stringify(infected.body));
    assert.equal(infected.body.data.scanStatus, "infected");
    infectedA = infected.body.data;

    const other = await uploadPdf(tokens.studentB, otherStudentTaskA);
    assert.equal(other.status, 201, JSON.stringify(other.body));
    otherStudentA = other.body.data;

    const teacherBFile = await uploadPdf(tokens.studentB, cleanTaskB);
    assert.equal(teacherBFile.status, 201, JSON.stringify(teacherBFile.body));
    cleanB = teacherBFile.body.data;
  });

  let pendingId;
  await suite.test("bloquea un archivo infectado", async () => {
    const infectedDownload = await request(app)
      .get(`/api/submissions/${infectedA.id}/file`)
      .set("Authorization", `Bearer ${tokens.studentA}`);
    assert.equal(infectedDownload.status, 409);
    assert.equal(infectedDownload.body.code, "FILE_NOT_CLEAN");
  });

  await suite.test("bloquea un archivo pendiente", async () => {
    const [pending] = await db.query(
      `INSERT INTO submissions
         (taskId, studentId, fileUrl, storage_key, original_file_name,
          stored_file_name, file_extension, mime_type, file_size, file_hash,
          scan_status, status)
       VALUES (?, ?, NULL, 'quarantine/pending.pdf', 'pending.pdf', 'pending.pdf',
               'pdf', 'application/pdf', 10, ?, 'pending', 'submitted')`,
      [pendingTaskA, studentA.id, "b".repeat(64)]
    );
    pendingId = pending.insertId;
    await db.query(
      "UPDATE submissions SET fileUrl = ? WHERE id = ?",
      [`/api/submissions/${pendingId}/file`, pendingId]
    );
    const pendingDownload = await request(app)
      .get(`/api/submissions/${pendingId}/file`)
      .set("Authorization", `Bearer ${tokens.studentA}`);
    assert.equal(pendingDownload.status, 409);
    assert.equal(pendingDownload.body.code, "FILE_NOT_CLEAN");
  });

  await suite.test("aplica permisos de visualizacion y descarga", async () => {
    const ownPdf = await request(app)
      .get(`/api/submissions/${cleanA.id}/file`)
      .set("Authorization", `Bearer ${tokens.studentA}`);
    assert.equal(ownPdf.status, 200);
    assert.match(ownPdf.headers["content-type"], /^application\/pdf/);
    assert.match(ownPdf.headers["content-disposition"], /^inline/);
    assert.equal(ownPdf.headers["x-content-type-options"], "nosniff");
    assert.equal(ownPdf.headers["cache-control"], "private, no-store");

    const otherStudent = await request(app)
      .get(`/api/submissions/${otherStudentA.id}/file`)
      .set("Authorization", `Bearer ${tokens.studentA}`);
    assert.equal(otherStudent.status, 403);

    const wrongTeacher = await request(app)
      .get(`/api/submissions/${cleanB.id}/file`)
      .set("Authorization", `Bearer ${tokens.teacherA}`);
    assert.equal(wrongTeacher.status, 403);

    const ownerTeacher = await request(app)
      .get(`/api/submissions/${cleanB.id}/file`)
      .set("Authorization", `Bearer ${tokens.teacherB}`);
    assert.equal(ownerTeacher.status, 200);
  });

  for (const [label, q] of [
    ["nombre", "ana"],
    ["apellido", "rodriguez"],
    ["correo", "ana@test.local"],
    ["nombre completo", "ana rodriguez"]
  ]) {
    await suite.test(`busca estudiantes por ${label}`, async () => {
      const response = await request(app)
        .get("/api/users/search")
        .query({ q, role: "student" })
        .set("Authorization", `Bearer ${tokens.admin}`);
      assert.equal(response.status, 200, JSON.stringify(response.body));
      assert.ok(response.body.items.some((item) => item.id === studentA.id));
      assert.equal(response.body.items[0].password, undefined);
    });
  }

  await suite.test("profesor solo busca estudiantes de sus cursos", async () => {
    const response = await request(app)
      .get("/api/users/search")
      .query({ q: "ana", role: "student" })
      .set("Authorization", `Bearer ${tokens.teacherA}`);
    assert.equal(response.status, 200);
    assert.ok(response.body.items.some((item) => item.id === studentA.id));

    const denied = await request(app)
      .get("/api/users/search")
      .query({ q: "ana" })
      .set("Authorization", `Bearer ${tokens.studentA}`);
    assert.equal(denied.status, 403);
  });

  await suite.test("no expone un error SQL al cliente", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${tokens.admin}`)
      .send({
        name: "Duplicado",
        lastName: "Local",
        email: "duplicate@test.local",
        password: "Test.Password.2026",
        role: "student",
        status: "active",
        studentNumber: "EST-A",
        gradeLevel: "4to de secundaria",
        section: "A",
        academicYear: "2026"
      });
    assert.equal(response.status, 409);
    assert.equal(response.body.code, "USER_IDENTIFIER_ALREADY_EXISTS");
    const serialized = JSON.stringify(response.body);
    assert.doesNotMatch(serialized, /Duplicate entry|student_number|INSERT INTO|SQL/i);
  });

  await suite.test("dashboard de profesor usa metricas academicas", async () => {
    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${tokens.teacherA}`);
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.deepEqual(
      Object.keys(response.body.data).sort(),
      [
        "createdTasks",
        "myCourses",
        "pendingReviewTasks",
        "pendingReviews",
        "receivedSubmissions",
        "unreadNotifications"
      ].sort()
    );
  });

  await new Promise((resolve) => setTimeout(resolve, 100));
  await db.end();
});
