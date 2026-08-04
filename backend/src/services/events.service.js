const db = require("../config/db");
const eventBus = require("../events/eventBus");
const { AppError } = require("../helpers/errors");
const {
  parseOptionalIsoDate,
  assertEndAfterStart,
  serializeDateFields,
  toMysqlDateTime
} = require("../helpers/dates");

const toApiEvent = (event) => serializeDateFields(event, [
  "startDate",
  "endDate",
  "createdAt",
  "updatedAt"
]);
const mapEvents = (events) => events.map(toApiEvent);

const eventSelect = `
  e.id,
  e.courseId,
  e.userId,
  e.createdBy,
  e.title,
  e.description,
  e.eventType,
  e.startDate,
  e.endDate,
  e.location,
  e.meetingUrl,
  e.data,
  e.createdAt,
  e.updatedAt,
  c.name AS courseName
`;

const canAccessCourseEvent = async (courseId, user) => {
  if (!courseId || user.role === "admin") {
    return true;
  }

  if (user.role === "teacher") {
    const [rows] = await db.query(
      "SELECT id FROM courses WHERE id = ? AND teacherId = ? AND deletedAt IS NULL",
      [courseId, user.userId]
    );
    return rows.length > 0;
  }

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
  return rows.length > 0;
};

const createEvent = async ({
  courseId = null,
  title,
  description,
  eventType,
  startDate,
  endDate,
  location,
  meetingUrl,
  data
}, user) => {
  if (courseId && !(await canAccessCourseEvent(courseId, user))) {
    throw new AppError("No puedes crear eventos para este curso", 403);
  }

  if (user.role === "student") {
    throw new AppError("No tienes permisos para crear eventos", 403);
  }

  const startDateUtc = parseOptionalIsoDate(startDate);
  const endDateUtc = parseOptionalIsoDate(endDate);
  assertEndAfterStart(startDateUtc, endDateUtc);

  const [result] = await db.query(
    `
    INSERT INTO events
      (courseId, userId, createdBy, title, description, eventType, startDate, endDate, location, meetingUrl, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      courseId,
      user.userId,
      user.userId,
      title || eventType,
      description || null,
      eventType,
      toMysqlDateTime(startDateUtc),
      toMysqlDateTime(endDateUtc),
      location || null,
      meetingUrl || null,
      JSON.stringify(data || {})
    ]
  );

  const event = await findEventById(result.insertId);
  eventBus.emit("EVENT_CREATED", event);
  return event;
};

const getEvents = async (user) => {
  if (user.role === "admin") {
    const [rows] = await db.query(
      `
      SELECT ${eventSelect}
      FROM events e
      LEFT JOIN courses c ON e.courseId = c.id
      ORDER BY COALESCE(e.startDate, e.createdAt) DESC
      `
    );
    return mapEvents(rows);
  }

  if (user.role === "teacher") {
    const [rows] = await db.query(
      `
      SELECT ${eventSelect}
      FROM events e
      LEFT JOIN courses c ON e.courseId = c.id
      WHERE e.courseId IS NULL
        OR c.teacherId = ?
      ORDER BY COALESCE(e.startDate, e.createdAt) DESC
      `,
      [user.userId]
    );
    return mapEvents(rows);
  }

  const [rows] = await db.query(
    `
    SELECT ${eventSelect}
    FROM events e
    LEFT JOIN courses c ON e.courseId = c.id
    LEFT JOIN courseStudents cs
      ON cs.courseId = e.courseId
      AND cs.studentId = ?
      AND cs.status = 'active'
      AND cs.deletedAt IS NULL
    WHERE e.courseId IS NULL
      OR cs.id IS NOT NULL
    ORDER BY COALESCE(e.startDate, e.createdAt) DESC
    `,
    [user.userId]
  );
  return mapEvents(rows);
};

const findEventById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT ${eventSelect}
    FROM events e
    LEFT JOIN courses c ON e.courseId = c.id
    WHERE e.id = ?
    `,
    [id]
  );
  return toApiEvent(rows[0]);
};

const findEventForUser = async (id, user) => {
  const event = await findEventById(id);
  if (!event) {
    throw new AppError("Evento no encontrado", 404);
  }

  if (!(await canAccessCourseEvent(event.courseId, user))) {
    throw new AppError("No tienes permisos para acceder a este evento", 403);
  }

  return event;
};

const findEventByUser = async (userId) => {
  const [rows] = await db.query(
    `
    SELECT ${eventSelect}
    FROM events e
    LEFT JOIN courses c ON e.courseId = c.id
    WHERE e.userId = ? OR e.createdBy = ?
    ORDER BY COALESCE(e.startDate, e.createdAt) DESC
    `,
    [userId, userId]
  );
  return mapEvents(rows);
};

const deleteEvent = async (id, user) => {
  const event = await findEventForUser(id, user);

  if (user.role === "student") {
    throw new AppError("No tienes permisos para eliminar eventos", 403);
  }

  if (user.role === "teacher" && Number(event.createdBy) !== Number(user.userId)) {
    throw new AppError("Solo puedes eliminar eventos creados por ti", 403);
  }

  await db.query("DELETE FROM events WHERE id = ?", [id]);
  return { id };
};

module.exports = {
  createEvent,
  getEvents,
  findEventById,
  findEventForUser,
  findEventByUser,
  deleteEvent
};
