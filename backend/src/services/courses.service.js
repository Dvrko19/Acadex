const db = require("../config/db");
const eventBus = require("../events/eventBus");
const { AppError } = require("../helpers/errors");

const courseSelect = `
  c.id,
  c.name,
  c.description,
  c.teacherId,
  c.status,
  c.createdAt,
  c.updatedAt,
  u.name AS teacher
`;

const findCourseById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT ${courseSelect}
    FROM courses c
    INNER JOIN users u ON c.teacherId = u.id
    WHERE c.id = ?
      AND c.deletedAt IS NULL
    `,
    [id]
  );
  return rows[0];
};

const getCourses = async () => {
  const [rows] = await db.query(
    `
    SELECT ${courseSelect}
    FROM courses c
    INNER JOIN users u ON c.teacherId = u.id
    WHERE c.deletedAt IS NULL
    ORDER BY c.name
    `
  );
  return rows;
};

const getCourseByTeacher = async (teacherId) => {
  const [rows] = await db.query(
    `
    SELECT ${courseSelect}
    FROM courses c
    INNER JOIN users u ON c.teacherId = u.id
    WHERE c.teacherId = ?
      AND c.deletedAt IS NULL
      AND c.status = 'active'
    ORDER BY c.name
    `,
    [teacherId]
  );
  return rows;
};

const getCoursesByStudent = async (studentId) => {
  const [rows] = await db.query(
    `
    SELECT
      ${courseSelect},
      cs.status AS enrollmentStatus,
      cs.enrolledAt
    FROM courseStudents cs
    INNER JOIN courses c ON cs.courseId = c.id
    INNER JOIN users u ON c.teacherId = u.id
    WHERE cs.studentId = ?
      AND cs.status = 'active'
      AND cs.deletedAt IS NULL
      AND c.deletedAt IS NULL
      AND c.status = 'active'
    ORDER BY c.name
    `,
    [studentId]
  );

  return rows;
};

const assertCanAccessCourse = async (courseId, user) => {
  const course = await findCourseById(courseId);

  if (!course) {
    throw new AppError("Curso no encontrado", 404);
  }

  if (user.role === "admin") {
    return course;
  }

  if (user.role === "teacher" && Number(course.teacherId) === Number(user.userId)) {
    return course;
  }

  if (user.role === "student") {
    const [rows] = await db.query(
      `
      SELECT id
      FROM courseStudents
      WHERE courseId = ?
        AND studentId = ?
        AND status = 'active'
        AND deletedAt IS NULL
      `,
      [courseId, user.userId]
    );

    if (rows.length > 0) {
      return course;
    }
  }

  throw new AppError("No tienes permisos para acceder a este curso", 403);
};

const createCourse = async ({ name, description, teacherId, status = "active" }) => {
  const [users] = await db.query(
    `
    SELECT id
    FROM users
    WHERE id = ?
      AND role = 'teacher'
      AND status = 'active'
      AND deletedAt IS NULL
    `,
    [teacherId]
  );

  if (users.length === 0) {
    throw new AppError("teacherId debe pertenecer a un profesor activo", 400);
  }

  const [result] = await db.query(
    `
    INSERT INTO courses (name, description, teacherId, status)
    VALUES (?, ?, ?, ?)
    `,
    [name, description || null, teacherId, status]
  );

  const createdCourse = await findCourseById(result.insertId);
  eventBus.emit("COURSE_CREATED", createdCourse);
  return createdCourse;
};

const updateCourses = async (id, { name, description, teacherId, status }) => {
  const currentCourse = await findCourseById(id);

  if (!currentCourse) {
    throw new AppError("Curso no encontrado", 404);
  }

  if (teacherId) {
    const [users] = await db.query(
      `
      SELECT id
      FROM users
      WHERE id = ?
        AND role = 'teacher'
        AND status = 'active'
        AND deletedAt IS NULL
      `,
      [teacherId]
    );

    if (users.length === 0) {
      throw new AppError("teacherId debe pertenecer a un profesor activo", 400);
    }
  }

  await db.query(
    `
    UPDATE courses
    SET name = ?, description = ?, teacherId = ?, status = ?
    WHERE id = ?
    `,
    [
      name || currentCourse.name,
      description ?? currentCourse.description,
      teacherId || currentCourse.teacherId,
      status || currentCourse.status,
      id
    ]
  );

  const updatedCourse = await findCourseById(id);
  eventBus.emit("COURSE_UPDATED", updatedCourse);
  return updatedCourse;
};

const deleteCourse = async (id) => {
  const [result] = await db.query(
    `
    UPDATE courses
    SET status = 'inactive', deletedAt = CURRENT_TIMESTAMP
    WHERE id = ? AND deletedAt IS NULL
    `,
    [id]
  );

  if (result.affectedRows === 0) {
    throw new AppError("Curso no encontrado", 404);
  }

  const deletedCourse = { id };
  eventBus.emit("COURSE_DEACTIVATED", deletedCourse);
  return deletedCourse;
};

const enrollStudentInCourse = async ({ courseId, studentId }) => {
  const course = await findCourseById(courseId);
  if (!course || course.status !== "active") {
    throw new AppError("Curso no encontrado o inactivo", 404);
  }

  const [students] = await db.query(
    `
    SELECT id
    FROM users
    WHERE id = ?
      AND role = 'student'
      AND status = 'active'
      AND deletedAt IS NULL
    `,
    [studentId]
  );

  if (students.length === 0) {
    throw new AppError("studentId debe pertenecer a un estudiante activo", 400);
  }

  const [existing] = await db.query(
    "SELECT id FROM courseStudents WHERE courseId = ? AND studentId = ?",
    [courseId, studentId]
  );

  if (existing.length > 0) {
    await db.query(
      `
      UPDATE courseStudents
      SET status = 'active', deletedAt = NULL, enrolledAt = COALESCE(enrolledAt, NOW())
      WHERE id = ?
      `,
      [existing[0].id]
    );

    const enrollment = { id: existing[0].id, courseId, studentId };
    eventBus.emit("COURSE_ENROLLMENT_CREATED", enrollment);
    return enrollment;
  }

  const [result] = await db.query(
    `
    INSERT INTO courseStudents (courseId, studentId, status, enrolledAt)
    VALUES (?, ?, 'active', NOW())
    `,
    [courseId, studentId]
  );

  const enrollment = {
    id: result.insertId,
    courseId,
    studentId
  };

  eventBus.emit("COURSE_ENROLLMENT_CREATED", enrollment);
  return enrollment;
};

const getStudentsByCourses = async (courseId) => {
  const [rows] = await db.query(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      cs.status AS enrollmentStatus,
      cs.enrolledAt
    FROM courseStudents cs
    INNER JOIN users u ON cs.studentId = u.id
    WHERE cs.courseId = ?
      AND cs.deletedAt IS NULL
      AND cs.status = 'active'
      AND u.deletedAt IS NULL
    ORDER BY u.name
    `,
    [courseId]
  );
  return rows;
};

const removeStudentFromCourse = async ({ courseId, studentId }) => {
  const [result] = await db.query(
    `
    UPDATE courseStudents
    SET status = 'inactive', deletedAt = CURRENT_TIMESTAMP
    WHERE courseId = ? AND studentId = ? AND deletedAt IS NULL
    `,
    [courseId, studentId]
  );

  if (result.affectedRows === 0) {
    throw new AppError("Inscripcion no encontrada", 404);
  }

  const removedStudent = { courseId, studentId };
  eventBus.emit("COURSE_ENROLLMENT_DEACTIVATED", removedStudent);
  return removedStudent;
};

module.exports = {
  findCourseById,
  getCourses,
  createCourse,
  deleteCourse,
  updateCourses,
  getCourseByTeacher,
  enrollStudentInCourse,
  getStudentsByCourses,
  getCoursesByStudent,
  removeStudentFromCourse,
  assertCanAccessCourse
};
