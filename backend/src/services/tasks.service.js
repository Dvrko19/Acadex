const db = require("../config/db");
const eventBus = require("../events/eventBus");
const { AppError } = require("../helpers/errors");
const { serializeDateFields, toMysqlDateTime } = require("../helpers/dates");

const toApiTask = (task) => serializeDateFields(task, [
  "dueDate",
  "createdAt",
  "updatedAt"
]);
const mapTasks = (tasks) => tasks.map(toApiTask);

const taskSelect = `
  t.id,
  t.courseId,
  t.title,
  t.description,
  t.dueDate,
  t.maxScore,
  t.status,
  t.createdBy,
  t.createdAt,
  t.updatedAt,
  c.name AS courseName,
  c.teacherId
`;

const getTaskById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT ${taskSelect}
    FROM tasks t
    INNER JOIN courses c ON t.courseId = c.id
    WHERE t.id = ?
      AND t.deletedAt IS NULL
      AND c.deletedAt IS NULL
    `,
    [id]
  );
  return rows[0];
};

const getTasks = async (user) => {
  if (user.role === "admin") {
    const [rows] = await db.query(
      `
      SELECT ${taskSelect}
      FROM tasks t
      INNER JOIN courses c ON t.courseId = c.id
      WHERE t.deletedAt IS NULL
      ORDER BY t.dueDate ASC
      `
    );
    return mapTasks(rows);
  }

  if (user.role === "teacher") {
    const [rows] = await db.query(
      `
      SELECT ${taskSelect}
      FROM tasks t
      INNER JOIN courses c ON t.courseId = c.id
      WHERE c.teacherId = ?
        AND t.deletedAt IS NULL
        AND c.deletedAt IS NULL
      ORDER BY t.dueDate ASC
      `,
      [user.userId]
    );
    return mapTasks(rows);
  }

  const [rows] = await db.query(
    `
    SELECT
      ${taskSelect},
      s.id AS submissionId,
      s.status AS submissionStatus,
      s.grade,
      s.feedback
    FROM tasks t
    INNER JOIN courses c ON t.courseId = c.id
    INNER JOIN courseStudents cs ON cs.courseId = c.id
    LEFT JOIN submissions s
      ON s.taskId = t.id
      AND s.studentId = cs.studentId
      AND s.deletedAt IS NULL
    WHERE cs.studentId = ?
      AND cs.status = 'active'
      AND cs.deletedAt IS NULL
      AND t.deletedAt IS NULL
      AND c.deletedAt IS NULL
      AND c.status = 'active'
    ORDER BY t.dueDate ASC
    `,
    [user.userId]
  );

  return mapTasks(rows);
};

const assertCanAccessTask = async (taskId, user) => {
  const task = await getTaskById(taskId);

  if (!task) {
    throw new AppError("Tarea no encontrada", 404);
  }

  if (user.role === "admin") {
    return task;
  }

  if (user.role === "teacher" && Number(task.teacherId) === Number(user.userId)) {
    return task;
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
      [task.courseId, user.userId]
    );

    if (rows.length > 0) {
      return task;
    }
  }

  throw new AppError("No tienes permisos para acceder a esta tarea", 403);
};

const assertCanManageTaskCourse = async (courseId, user) => {
  if (user.role === "admin") {
    return;
  }

  const [rows] = await db.query(
    `
    SELECT id
    FROM courses
    WHERE id = ?
      AND teacherId = ?
      AND status = 'active'
      AND deletedAt IS NULL
    `,
    [courseId, user.userId]
  );

  if (rows.length === 0) {
    throw new AppError("No puedes administrar tareas de este curso", 403);
  }
};

const createTask = async ({ courseId, title, description, dueDate, maxScore, status }, user) => {
  await assertCanManageTaskCourse(courseId, user);

  const [result] = await db.query(
    `
    INSERT INTO tasks
      (courseId, title, description, dueDate, maxScore, status, createdBy)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      courseId,
      title,
      description || null,
      toMysqlDateTime(dueDate),
      maxScore || 100,
      status || "published",
      user.userId
    ]
  );

  const createdTask = await getTaskById(result.insertId);
  eventBus.emit("TASK_CREATED", createdTask);
  return createdTask;
};

const updateTask = async (id, payload, user) => {
  const currentTask = await getTaskById(id);

  if (!currentTask) {
    throw new AppError("Tarea no encontrada", 404);
  }

  await assertCanManageTaskCourse(currentTask.courseId, user);

  const nextCourseId = payload.courseId || currentTask.courseId;
  if (nextCourseId !== currentTask.courseId) {
    await assertCanManageTaskCourse(nextCourseId, user);
  }

  await db.query(
    `
    UPDATE tasks
    SET courseId = ?, title = ?, description = ?, dueDate = ?, maxScore = ?, status = ?
    WHERE id = ?
    `,
    [
      nextCourseId,
      payload.title || currentTask.title,
      payload.description ?? currentTask.description,
      toMysqlDateTime(payload.dueDate || currentTask.dueDate),
      payload.maxScore ?? currentTask.maxScore,
      payload.status || currentTask.status,
      id
    ]
  );

  const updatedTask = await getTaskById(id);
  eventBus.emit("TASK_UPDATED", updatedTask);
  return updatedTask;
};

const deleteTask = async (id, user) => {
  const task = await getTaskById(id);
  if (!task) {
    throw new AppError("Tarea no encontrada", 404);
  }

  await assertCanManageTaskCourse(task.courseId, user);

  const [submissions] = await db.query(
    "SELECT COUNT(*) AS total FROM submissions WHERE taskId = ? AND deletedAt IS NULL",
    [id]
  );

  if (submissions[0].total > 0) {
    await db.query(
      `
      UPDATE tasks
      SET status = 'closed', deletedAt = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [id]
    );
  } else {
    await db.query(
      `
      UPDATE tasks
      SET deletedAt = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [id]
    );
  }

  const deletedTask = { id };
  eventBus.emit("TASK_DELETED", deletedTask);
  return deletedTask;
};

const getTaskByCourse = async (courseId, user) => {
  await assertCanManageTaskCourse(courseId, user).catch(async (error) => {
    if (user.role !== "student") throw error;
    await assertCanAccessTaskByCourseForStudent(courseId, user.userId);
  });

  const [rows] = await db.query(
    `
    SELECT ${taskSelect}
    FROM tasks t
    INNER JOIN courses c ON t.courseId = c.id
    WHERE t.courseId = ?
      AND t.deletedAt IS NULL
    ORDER BY t.dueDate ASC
    `,
    [courseId]
  );
  return mapTasks(rows);
};

const assertCanAccessTaskByCourseForStudent = async (courseId, studentId) => {
  const [rows] = await db.query(
    `
    SELECT id
    FROM courseStudents
    WHERE courseId = ?
      AND studentId = ?
      AND status = 'active'
      AND deletedAt IS NULL
    `,
    [courseId, studentId]
  );

  if (rows.length === 0) {
    throw new AppError("No tienes permisos para acceder a este curso", 403);
  }
};

const getPendingTasks = async (user) => {
  if (user.role === "teacher") {
    const [rows] = await db.query(
      `
      SELECT
        ${taskSelect},
        COUNT(s.id) AS pendingReviews
      FROM tasks t
      INNER JOIN courses c ON t.courseId = c.id
      INNER JOIN submissions s ON s.taskId = t.id
      WHERE c.teacherId = ?
        AND s.status IN ('submitted', 'late')
        AND s.scan_status = 'clean'
        AND s.deletedAt IS NULL
        AND t.deletedAt IS NULL
      GROUP BY t.id
      ORDER BY pendingReviews DESC, t.dueDate ASC
      `,
      [user.userId]
    );
    return mapTasks(rows);
  }

  if (user.role === "student") {
    const [rows] = await db.query(
      `
      SELECT ${taskSelect}
      FROM tasks t
      INNER JOIN courses c ON t.courseId = c.id
      INNER JOIN courseStudents cs ON cs.courseId = c.id
      LEFT JOIN submissions s
        ON s.taskId = t.id
        AND s.studentId = cs.studentId
        AND s.deletedAt IS NULL
      WHERE cs.studentId = ?
        AND cs.status = 'active'
        AND cs.deletedAt IS NULL
        AND t.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND s.id IS NULL
      ORDER BY t.dueDate ASC
      `,
      [user.userId]
    );
    return mapTasks(rows);
  }

  const [rows] = await db.query(
    `
    SELECT *
    FROM tasks
    WHERE dueDate >= CURDATE()
      AND deletedAt IS NULL
    ORDER BY dueDate ASC
    `
  );
  return mapTasks(rows);
};

const getExpiredTasks = async () => {
  const [rows] = await db.query(
    `
    SELECT *
    FROM tasks
    WHERE dueDate < CURDATE()
      AND deletedAt IS NULL
    ORDER BY dueDate ASC
    `
  );
  return mapTasks(rows);
};

const findTaskByTitle = async (title, user) => {
  const tasks = await getTasks(user);
  return tasks.filter((task) => task.title.toLowerCase().includes(title.toLowerCase()));
};

const countTasks = async () => {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS total FROM tasks WHERE deletedAt IS NULL"
  );
  return rows[0];
};

module.exports = {
  getTasks,
  getTaskById,
  assertCanAccessTask,
  assertCanManageTaskCourse,
  createTask,
  updateTask,
  deleteTask,
  getTaskByCourse,
  getPendingTasks,
  getExpiredTasks,
  findTaskByTitle,
  countTasks
};
