const db = require("../config/db");
const { AppError } = require("../helpers/errors");

const databaseTypes = new Set([
  "task_created",
  "submission_created",
  "submission_graded",
  "course_updated",
  "general"
]);

const toDatabaseType = (type) => {
  const normalized = String(type || "general").toLowerCase();
  return databaseTypes.has(normalized) ? normalized : "general";
};

const toApiType = (notification) => {
  if (notification.type !== "general") return notification.type.toUpperCase();
  if (notification.referenceType === "event") return "EVENT_CREATED";
  if (notification.referenceType === "enrollment") {
    return "COURSE_ENROLLMENT_CREATED";
  }
  if (notification.referenceType === "submission_file_scan") {
    return "FILE_SCAN_REJECTED";
  }
  return "GENERAL";
};

const relatedResource = (notification) => {
  if (!notification.referenceId || !notification.referenceType) return null;
  const paths = {
    task: `/api/tasks/${notification.referenceId}`,
    course: `/api/courses/${notification.referenceId}`,
    event: `/api/events/${notification.referenceId}`,
    submission: `/api/submissions/${notification.referenceId}/file`,
    submission_file_scan: `/api/submissions/${notification.referenceId}/file`
  };
  return {
    type: notification.referenceType,
    id: notification.referenceId,
    href: paths[notification.referenceType] || null
  };
};

const toApiNotification = (notification) => notification && ({
  ...notification,
  type: toApiType(notification),
  relatedResource: relatedResource(notification)
});

const createNotification = async ({
  userId,
  type = "general",
  title = null,
  message,
  referenceId = null,
  referenceType = null
}) => {
  const [result] = await db.query(
    `
    INSERT INTO notifications
      (userId, type, title, message, referenceId, referenceType)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [userId, toDatabaseType(type), title, message, referenceId, referenceType]
  );

  return {
    id: result.insertId,
    userId,
    type: String(type || "general").toUpperCase(),
    title,
    message,
    referenceId,
    referenceType,
    isRead: false
  };
};

const getNotification = async () => {
  const [rows] = await db.query(
    `
    SELECT *
    FROM notifications
    WHERE deletedAt IS NULL
    ORDER BY createdAt DESC
    `
  );
  return rows.map(toApiNotification);
};

const findNotificationById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT *
    FROM notifications
    WHERE id = ?
      AND deletedAt IS NULL
    `,
    [id]
  );
  return toApiNotification(rows[0]);
};

const getNotificationByuser = async (userId) => {
  const [rows] = await db.query(
    `
    SELECT *
    FROM notifications
    WHERE userId = ?
      AND deletedAt IS NULL
    ORDER BY createdAt DESC
    `,
    [userId]
  );
  return rows.map(toApiNotification);
};

const countUnreadByUser = async (userId) => {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM notifications
    WHERE userId = ?
      AND isRead = 0
      AND deletedAt IS NULL
    `,
    [userId]
  );
  return rows[0].total;
};

const markAsRead = async (id, userId) => {
  const [notifications] = await db.query(
    `SELECT * FROM notifications
     WHERE id = ? AND userId = ? AND deletedAt IS NULL`,
    [id, userId]
  );
  if (!notifications[0]) {
    throw new AppError("Notificacion no encontrada", 404, "NOTIFICATION_NOT_FOUND");
  }

  const [result] = await db.query(
    `
    UPDATE notifications
    SET isRead = 1, readAt = NOW()
    WHERE id = ?
      AND userId = ?
      AND deletedAt IS NULL
    `,
    [id, userId]
  );

  if (result.affectedRows === 0) {
    throw new AppError("Notificacion no encontrada", 404);
  }

  return toApiNotification({
    ...notifications[0],
    isRead: 1,
    readAt: new Date()
  });
};

const markAllAsRead = async (userId) => {
  const [result] = await db.query(
    `
    UPDATE notifications
    SET isRead = 1, readAt = NOW()
    WHERE userId = ?
      AND isRead = 0
      AND deletedAt IS NULL
    `,
    [userId]
  );

  return { updated: result.affectedRows };
};

const deleteNotification = async (id, user) => {
  const params = user.role === "admin" ? [id] : [id, user.userId];
  const ownerFilter = user.role === "admin" ? "" : "AND userId = ?";
  const [result] = await db.query(
    `
    UPDATE notifications
    SET deletedAt = CURRENT_TIMESTAMP
    WHERE id = ?
      ${ownerFilter}
      AND deletedAt IS NULL
    `,
    params
  );

  if (result.affectedRows === 0) {
    throw new AppError("Notificacion no encontrada", 404);
  }

  return { id };
};

module.exports = {
  createNotification,
  getNotification,
  findNotificationById,
  getNotificationByuser,
  countUnreadByUser,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
