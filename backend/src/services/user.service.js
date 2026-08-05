const bcrypt = require("bcrypt");
const db = require("../config/db");
const eventBus = require("../events/eventBus");
const { AppError } = require("../helpers/errors");
const { parseDateOnly } = require("../helpers/dates");

const roles = new Set(["admin", "teacher", "student"]);
const statuses = new Set(["active", "inactive"]);

const userSelect = `
  u.id,
  u.name,
  u.last_name AS lastName,
  TRIM(CONCAT_WS(' ', u.name, u.last_name)) AS fullName,
  u.email,
  u.role,
  u.status,
  DATE_FORMAT(u.date_of_birth, '%Y-%m-%d') AS dateOfBirth,
  CASE
    WHEN u.date_of_birth IS NULL THEN NULL
    ELSE TIMESTAMPDIFF(YEAR, u.date_of_birth, UTC_DATE())
  END AS age,
  u.phone,
  u.createdAt,
  u.updatedAt,
  u.deletedAt,
  sp.student_number AS studentNumber,
  sp.grade_level AS gradeLevel,
  sp.section,
  sp.academic_year AS academicYear,
  sp.guardian_name AS guardianName,
  sp.guardian_phone AS guardianPhone,
  tp.employee_number AS employeeNumber,
  tp.subject_area AS subjectArea
`;

const baseUserQuery = `
  FROM users u
  LEFT JOIN student_profiles sp ON sp.user_id = u.id
  LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
`;

const validateRoleAndStatus = (role, status = "active") => {
  if (!roles.has(role)) throw new AppError("Rol invalido", 400, "INVALID_ROLE");
  if (!statuses.has(status)) {
    throw new AppError("Estado invalido", 400, "INVALID_USER_STATUS");
  }
};

const validateSchoolData = (role, payload) => {
  if (role === "student") {
    for (const field of ["studentNumber", "gradeLevel", "section", "academicYear"]) {
      if (!payload[field]) {
        throw new AppError(
          `El campo ${field} es obligatorio para estudiantes`,
          400,
          "STUDENT_DATA_REQUIRED"
        );
      }
    }
  }
  if (role === "teacher" && !payload.subjectArea) {
    throw new AppError(
      "El campo subjectArea es obligatorio para profesores",
      400,
      "TEACHER_DATA_REQUIRED"
    );
  }
};

const findAll = async () => {
  const [rows] = await db.query(
    `SELECT ${userSelect} ${baseUserQuery}
     WHERE u.deletedAt IS NULL ORDER BY u.name, u.last_name`
  );
  return rows;
};

const findByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ?",
    [String(email).trim().toLowerCase()]
  );
  return rows[0];
};

const findById = async (id) => {
  const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
};

const findSafeById = async (id) => {
  const [rows] = await db.query(
    `SELECT ${userSelect} ${baseUserQuery} WHERE u.id = ?`,
    [id]
  );
  return rows[0];
};

const insertRoleProfile = async (connection, userId, role, payload) => {
  if (role === "student") {
    await connection.query(
      `INSERT INTO student_profiles
         (user_id, student_number, grade_level, section, academic_year,
          guardian_name, guardian_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        payload.studentNumber,
        payload.gradeLevel,
        payload.section,
        payload.academicYear,
        payload.guardianName || null,
        payload.guardianPhone || null
      ]
    );
  }
  if (role === "teacher") {
    await connection.query(
      `INSERT INTO teacher_profiles (user_id, employee_number, subject_area)
       VALUES (?, ?, ?)`,
      [userId, payload.employeeNumber || null, payload.subjectArea]
    );
  }
};

const translateDuplicateError = (error) => {
  if (error.code !== "ER_DUP_ENTRY") throw error;
  throw new AppError(
    "El correo o identificador escolar ya esta registrado",
    409,
    "USER_IDENTIFIER_ALREADY_EXISTS"
  );
};

const createUser = async (payload) => {
  const {
    name,
    lastName = null,
    email,
    role,
    password,
    status = "active",
    dateOfBirth = null,
    phone = null
  } = payload;
  validateRoleAndStatus(role, status);
  validateSchoolData(role, payload);
  const birthDate = parseDateOnly(dateOfBirth);
  const normalizedEmail = String(email).trim().toLowerCase();
  if (await findByEmail(normalizedEmail)) {
    throw new AppError("El email ya esta registrado", 409, "EMAIL_ALREADY_EXISTS");
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await connection.query(
      `INSERT INTO users
         (name, last_name, email, date_of_birth, phone, role, status, password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, lastName, normalizedEmail, birthDate, phone, role, status, passwordHash]
    );
    await insertRoleProfile(connection, result.insertId, role, payload);
    await connection.commit();

    const created = await findSafeById(result.insertId);
    eventBus.emit("USER_CREATED", created);
    return created;
  } catch (error) {
    await connection.rollback();
    translateDuplicateError(error);
  } finally {
    connection.release();
  }
};

const replaceRoleProfile = async (connection, userId, role, payload) => {
  await connection.query("DELETE FROM student_profiles WHERE user_id = ?", [userId]);
  await connection.query("DELETE FROM teacher_profiles WHERE user_id = ?", [userId]);
  await insertRoleProfile(connection, userId, role, payload);
};

const mergeSchoolData = (current, payload, role) => {
  if (role === "student") {
    return {
      ...payload,
      studentNumber: payload.studentNumber ?? current.studentNumber,
      gradeLevel: payload.gradeLevel ?? current.gradeLevel,
      section: payload.section ?? current.section,
      academicYear: payload.academicYear ?? current.academicYear,
      guardianName: payload.guardianName ?? current.guardianName,
      guardianPhone: payload.guardianPhone ?? current.guardianPhone
    };
  }
  if (role === "teacher") {
    return {
      ...payload,
      employeeNumber: payload.employeeNumber ?? current.employeeNumber,
      subjectArea: payload.subjectArea ?? current.subjectArea
    };
  }
  return payload;
};

const updateUser = async (id, payload) => {
  const current = await findSafeById(id);
  const currentPrivate = await findById(id);
  if (!current || current.deletedAt || !currentPrivate) {
    throw new AppError("Usuario no encontrado", 404, "USER_NOT_FOUND");
  }

  const nextRole = payload.role || current.role;
  const nextStatus = payload.status || current.status;
  validateRoleAndStatus(nextRole, nextStatus);
  const merged = mergeSchoolData(current, payload, nextRole);
  validateSchoolData(nextRole, merged);
  const birthDate = payload.dateOfBirth === undefined
    ? current.dateOfBirth
    : parseDateOnly(payload.dateOfBirth);
  const normalizedEmail = payload.email
    ? String(payload.email).trim().toLowerCase()
    : current.email;

  const duplicate = await findByEmail(normalizedEmail);
  if (duplicate && Number(duplicate.id) !== Number(id)) {
    throw new AppError("El email ya esta registrado", 409, "EMAIL_ALREADY_EXISTS");
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const passwordValue = payload.password
      ? await bcrypt.hash(payload.password, 12)
      : currentPrivate.password;
    await connection.query(
      `UPDATE users
       SET name = ?, last_name = ?, email = ?, date_of_birth = ?, phone = ?,
           role = ?, status = ?, password = ?
       WHERE id = ?`,
      [
        payload.name || current.name,
        payload.lastName ?? current.lastName,
        normalizedEmail,
        birthDate,
        payload.phone ?? current.phone,
        nextRole,
        nextStatus,
        passwordValue,
        id
      ]
    );
    await replaceRoleProfile(connection, id, nextRole, merged);
    await connection.commit();

    const updated = await findSafeById(id);
    eventBus.emit("USER_UPDATED", updated);
    return updated;
  } catch (error) {
    await connection.rollback();
    translateDuplicateError(error);
  } finally {
    connection.release();
  }
};

const searchUsers = async ({ q, role, page = 1, limit = 20 }, requester) => {
  const term = String(q || "").trim();
  if (term.length < 2) {
    throw new AppError(
      "La busqueda debe contener al menos 2 caracteres",
      400,
      "SEARCH_QUERY_TOO_SHORT"
    );
  }

  if (requester.role === "student") {
    throw new AppError(
      "No tienes permisos para buscar usuarios",
      403,
      "USER_SEARCH_DENIED"
    );
  }
  if (role && !["teacher", "student"].includes(role)) {
    throw new AppError("El rol de busqueda no es valido", 400, "INVALID_SEARCH_ROLE");
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 20);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  const pattern = `%${term}%`;
  const roleFilter = requester.role === "teacher" ? "student" : role;
  const params = [pattern, pattern, pattern, pattern];
  let scopeJoin = "";
  let scopeWhere = "";

  if (requester.role === "teacher") {
    scopeJoin = `
      INNER JOIN courseStudents cs
        ON cs.studentId = u.id AND cs.status = 'active' AND cs.deletedAt IS NULL
      INNER JOIN courses c
        ON c.id = cs.courseId AND c.teacherId = ?
        AND c.status = 'active' AND c.deletedAt IS NULL
    `;
    params.unshift(requester.userId);
  }
  if (roleFilter) {
    scopeWhere = "AND u.role = ?";
    params.push(roleFilter);
  } else {
    scopeWhere = "AND u.role IN ('teacher', 'student')";
  }
  params.push(safeLimit, offset);

  const [rows] = await db.query(
    `SELECT DISTINCT ${userSelect}
     ${baseUserQuery}
     ${scopeJoin}
     WHERE u.status = 'active' AND u.deletedAt IS NULL
       AND (
         u.name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?
         OR TRIM(CONCAT_WS(' ', u.name, u.last_name)) LIKE ?
       )
       ${scopeWhere}
     ORDER BY u.name, u.last_name
     LIMIT ? OFFSET ?`,
    params
  );

  return { items: rows, page: safePage, limit: safeLimit };
};

const deleteUser = async (id) => {
  const [result] = await db.query(
    `UPDATE users SET status = 'inactive', deletedAt = UTC_TIMESTAMP()
     WHERE id = ? AND deletedAt IS NULL`,
    [id]
  );
  if (result.affectedRows === 0) {
    throw new AppError("Usuario no encontrado", 404, "USER_NOT_FOUND");
  }
  eventBus.emit("USER_DEACTIVATED", { id });
  return { id };
};

module.exports = {
  findAll,
  findByEmail,
  findById,
  findSafeById,
  createUser,
  updateUser,
  searchUsers,
  deleteUser
};
