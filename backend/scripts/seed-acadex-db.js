require("dotenv").config();

const bcrypt = require("bcrypt");
const db = require("../src/config/db");

const hashPassword = async (password) => bcrypt.hash(password, 12);

const seedPasswords = {
  admin: process.env.SEED_ADMIN_PASSWORD || "Acadex.Admin.2026",
  teacher: process.env.SEED_TEACHER_PASSWORD || "Acadex.Teacher.2026",
  student: process.env.SEED_STUDENT_PASSWORD || "Acadex.Student.2026"
};

const getOne = async (sql, params = []) => {
  const [rows] = await db.query(sql, params);
  return rows[0];
};

const upsertUser = async ({ name, email, role, password }) => {
  const passwordHash = await hashPassword(password);
  const existing = await getOne("SELECT id FROM users WHERE email = ?", [email]);

  if (existing) {
    await db.query(
      `
      UPDATE users
      SET name = ?, role = ?, password = ?, status = 'active', deletedAt = NULL
      WHERE id = ?
      `,
      [name, role, passwordHash, existing.id]
    );
    return existing.id;
  }

  const [result] = await db.query(
    `
    INSERT INTO users (name, email, role, status, password)
    VALUES (?, ?, ?, 'active', ?)
    `,
    [name, email, role, passwordHash]
  );

  return result.insertId;
};

const upsertCourse = async ({ name, description, teacherId }) => {
  const existing = await getOne(
    "SELECT id FROM courses WHERE name = ? AND deletedAt IS NULL",
    [name]
  );

  if (existing) {
    await db.query(
      `
      UPDATE courses
      SET description = ?, teacherId = ?, status = 'active'
      WHERE id = ?
      `,
      [description, teacherId, existing.id]
    );
    return existing.id;
  }

  const [result] = await db.query(
    `
    INSERT INTO courses (name, description, teacherId, status)
    VALUES (?, ?, ?, 'active')
    `,
    [name, description, teacherId]
  );

  return result.insertId;
};

const upsertEnrollment = async ({ courseId, studentId, status = "active" }) => {
  const existing = await getOne(
    "SELECT id FROM courseStudents WHERE courseId = ? AND studentId = ?",
    [courseId, studentId]
  );

  if (existing) {
    await db.query(
      `
      UPDATE courseStudents
      SET status = ?, enrolledAt = COALESCE(enrolledAt, NOW()), deletedAt = NULL
      WHERE id = ?
      `,
      [status, existing.id]
    );
    return existing.id;
  }

  const [result] = await db.query(
    `
    INSERT INTO courseStudents (courseId, studentId, status, enrolledAt)
    VALUES (?, ?, ?, NOW())
    `,
    [courseId, studentId, status]
  );

  return result.insertId;
};

const upsertTask = async ({
  courseId,
  title,
  description,
  dueDate,
  maxScore = 100,
  status = "published",
  createdBy
}) => {
  const existing = await getOne(
    "SELECT id FROM tasks WHERE courseId = ? AND title = ? AND deletedAt IS NULL",
    [courseId, title]
  );

  if (existing) {
    await db.query(
      `
      UPDATE tasks
      SET description = ?, dueDate = ?, maxScore = ?, status = ?, createdBy = ?
      WHERE id = ?
      `,
      [description, dueDate, maxScore, status, createdBy, existing.id]
    );
    return existing.id;
  }

  const [result] = await db.query(
    `
    INSERT INTO tasks
      (courseId, title, description, dueDate, maxScore, status, createdBy)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [courseId, title, description, dueDate, maxScore, status, createdBy]
  );

  return result.insertId;
};

const upsertSubmission = async ({
  taskId,
  studentId,
  status = "submitted",
  grade = null,
  feedback = null,
  gradedBy = null,
  gradedAt = null
}) => {
  const existing = await getOne(
    "SELECT id FROM submissions WHERE taskId = ? AND studentId = ?",
    [taskId, studentId]
  );

  if (existing) {
    await db.query(
      `
      UPDATE submissions
      SET fileUrl = ?, status = ?, grade = ?, feedback = ?, gradedBy = ?, gradedAt = ?
      WHERE id = ?
      `,
      [`/api/submissions/${existing.id}/file`, status, grade, feedback, gradedBy, gradedAt, existing.id]
    );
    return existing.id;
  }

  const [result] = await db.query(
    `
    INSERT INTO submissions
      (taskId, studentId, fileUrl, status, grade, feedback, gradedBy, gradedAt)
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?)
    `,
    [taskId, studentId, status, grade, feedback, gradedBy, gradedAt]
  );

  await db.query(
    "UPDATE submissions SET fileUrl = ? WHERE id = ?",
    [`/api/submissions/${result.insertId}/file`, result.insertId]
  );

  return result.insertId;
};

const upsertEvent = async ({
  courseId,
  createdBy,
  userId,
  title,
  description,
  eventType,
  startDate,
  endDate,
  location,
  meetingUrl
}) => {
  const existing = await getOne(
    "SELECT id FROM events WHERE courseId = ? AND title = ?",
    [courseId, title]
  );

  if (existing) {
    await db.query(
      `
      UPDATE events
      SET createdBy = ?, userId = ?, description = ?, eventType = ?, startDate = ?,
          endDate = ?, location = ?, meetingUrl = ?
      WHERE id = ?
      `,
      [
        createdBy,
        userId,
        description,
        eventType,
        startDate,
        endDate,
        location,
        meetingUrl,
        existing.id
      ]
    );
    return existing.id;
  }

  const [result] = await db.query(
    `
    INSERT INTO events
      (courseId, createdBy, userId, title, description, eventType, startDate, endDate, location, meetingUrl, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, JSON_OBJECT())
    `,
    [
      courseId,
      createdBy,
      userId,
      title,
      description,
      eventType,
      startDate,
      endDate,
      location,
      meetingUrl
    ]
  );

  return result.insertId;
};

const createNotificationIfMissing = async ({
  userId,
  type,
  title,
  message,
  referenceId,
  referenceType,
  isRead = false
}) => {
  const existing = await getOne(
    `
    SELECT id
    FROM notifications
    WHERE userId = ?
      AND type = ?
      AND referenceId <=> ?
      AND referenceType <=> ?
      AND message = ?
      AND deletedAt IS NULL
    `,
    [userId, type, referenceId || null, referenceType || null, message]
  );

  if (existing) {
    return existing.id;
  }

  const [result] = await db.query(
    `
    INSERT INTO notifications
      (userId, type, title, message, referenceId, referenceType, isRead, readAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      type,
      title,
      message,
      referenceId || null,
      referenceType || null,
      isRead ? 1 : 0,
      isRead ? new Date() : null
    ]
  );

  return result.insertId;
};

const seed = async () => {
  const adminId = await upsertUser({
    name: "Admin Acadex",
    email: process.env.SEED_ADMIN_EMAIL || "admin@acadex.local",
    role: "admin",
    password: seedPasswords.admin
  });

  const teacherCarlosId = await upsertUser({
    name: "Carlos Gomez",
    email: "carlos.gomez@acadex.local",
    role: "teacher",
    password: seedPasswords.teacher
  });

  const teacherLauraId = await upsertUser({
    name: "Laura Martinez",
    email: "laura.martinez@acadex.local",
    role: "teacher",
    password: seedPasswords.teacher
  });

  const students = {};
  for (const student of [
    ["ana.rodriguez@acadex.local", "Ana Rodriguez"],
    ["juan.perez@acadex.local", "Juan Perez"],
    ["maria.lopez@acadex.local", "Maria Lopez"],
    ["pedro.sanchez@acadex.local", "Pedro Sanchez"]
  ]) {
    students[student[0]] = await upsertUser({
      name: student[1],
      email: student[0],
      role: "student",
      password: seedPasswords.student
    });
  }

  const algorithmsId = await upsertCourse({
    name: "Algoritmos",
    description: "Fundamentos de algoritmos, estructuras de control y resolucion de problemas.",
    teacherId: teacherCarlosId
  });

  const databasesId = await upsertCourse({
    name: "Base de Datos",
    description: "Modelo relacional, SQL, normalizacion y consultas.",
    teacherId: teacherLauraId
  });

  const networksId = await upsertCourse({
    name: "Redes de Computadoras",
    description: "Conceptos de redes, protocolos y comunicacion cliente-servidor.",
    teacherId: teacherCarlosId
  });

  const studentIds = Object.values(students);
  for (const studentId of studentIds) {
    await upsertEnrollment({ courseId: algorithmsId, studentId });
  }
  await upsertEnrollment({ courseId: databasesId, studentId: students["ana.rodriguez@acadex.local"] });
  await upsertEnrollment({ courseId: databasesId, studentId: students["juan.perez@acadex.local"] });
  await upsertEnrollment({ courseId: networksId, studentId: students["maria.lopez@acadex.local"] });
  await upsertEnrollment({ courseId: networksId, studentId: students["pedro.sanchez@acadex.local"] });

  const taskAlgorithms = await upsertTask({
    courseId: algorithmsId,
    title: "Algoritmos - Tarea 2",
    description: "Resolver problemas de busqueda y ordenamiento.",
    dueDate: "2026-08-15 23:59:00",
    maxScore: 100,
    createdBy: teacherCarlosId
  });

  const taskDatabases = await upsertTask({
    courseId: databasesId,
    title: "Base de Datos - Tarea 1",
    description: "Diseñar modelo entidad-relacion y consultas SQL.",
    dueDate: "2026-08-18 23:59:00",
    maxScore: 100,
    createdBy: teacherLauraId
  });

  const taskNetworks = await upsertTask({
    courseId: networksId,
    title: "Redes - Laboratorio 3",
    description: "Analizar paquetes y documentar flujo de red.",
    dueDate: "2026-08-20 23:59:00",
    maxScore: 100,
    createdBy: teacherCarlosId
  });

  await upsertSubmission({
    taskId: taskAlgorithms,
    studentId: students["ana.rodriguez@acadex.local"],
    status: "submitted"
  });

  await upsertSubmission({
    taskId: taskAlgorithms,
    studentId: students["juan.perez@acadex.local"],
    status: "graded",
    grade: 88,
    feedback: "Buen analisis. Revisa la complejidad del segundo ejercicio.",
    gradedBy: teacherCarlosId,
    gradedAt: new Date()
  });

  await upsertSubmission({
    taskId: taskDatabases,
    studentId: students["ana.rodriguez@acadex.local"],
    status: "graded",
    grade: 94,
    feedback: "Excelente normalizacion y consultas claras.",
    gradedBy: teacherLauraId,
    gradedAt: new Date()
  });

  await upsertSubmission({
    taskId: taskNetworks,
    studentId: students["maria.lopez@acadex.local"],
    status: "submitted"
  });

  await upsertEvent({
    courseId: algorithmsId,
    createdBy: teacherCarlosId,
    userId: teacherCarlosId,
    title: "Clase virtual - Algoritmos",
    description: "Repaso de ordenamiento y busqueda.",
    eventType: "class",
    startDate: "2026-08-05 10:00:00",
    endDate: "2026-08-05 11:30:00",
    location: null,
    meetingUrl: "https://meet.example.com/algoritmos"
  });

  await upsertEvent({
    courseId: databasesId,
    createdBy: teacherLauraId,
    userId: teacherLauraId,
    title: "Examen parcial - Base de Datos",
    description: "Evaluacion de modelo relacional y SQL.",
    eventType: "exam",
    startDate: "2026-08-12 09:00:00",
    endDate: "2026-08-12 11:00:00",
    location: "Aula 204",
    meetingUrl: null
  });

  await upsertEvent({
    courseId: networksId,
    createdBy: teacherCarlosId,
    userId: teacherCarlosId,
    title: "Laboratorio - Redes",
    description: "Practica de captura y analisis de paquetes.",
    eventType: "lab",
    startDate: "2026-08-10 14:00:00",
    endDate: "2026-08-10 16:00:00",
    location: "Laboratorio 3",
    meetingUrl: null
  });

  await createNotificationIfMissing({
    userId: adminId,
    type: "general",
    title: "Seed Acadex",
    message: "Datos academicos iniciales creados correctamente.",
    referenceType: "seed"
  });

  await createNotificationIfMissing({
    userId: students["ana.rodriguez@acadex.local"],
    type: "task_created",
    title: "Nueva tarea",
    message: "Se publico la tarea Algoritmos - Tarea 2.",
    referenceId: taskAlgorithms,
    referenceType: "task"
  });

  await createNotificationIfMissing({
    userId: teacherCarlosId,
    type: "submission_created",
    title: "Nueva entrega",
    message: "Ana Rodriguez realizo una entrega en Algoritmos - Tarea 2.",
    referenceId: taskAlgorithms,
    referenceType: "submission"
  });

  await createNotificationIfMissing({
    userId: students["juan.perez@acadex.local"],
    type: "submission_graded",
    title: "Entrega calificada",
    message: "Tu entrega de Algoritmos - Tarea 2 fue calificada.",
    referenceId: taskAlgorithms,
    referenceType: "submission"
  });

  await createNotificationIfMissing({
    userId: students["maria.lopez@acadex.local"],
    type: "course_updated",
    title: "Evento de curso",
    message: "Se agrego el laboratorio de Redes de Computadoras.",
    referenceId: networksId,
    referenceType: "course"
  });
};

seed()
  .then(async () => {
    await db.end();
    console.log("seed completed");
  })
  .catch(async (error) => {
    console.error(error);
    await db.end();
    process.exit(1);
  });
