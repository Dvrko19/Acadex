const db = require("../config/db");
const eventBus = require("../events/eventBus");
const notificationService = require("../services/notifications.service");

const notifyCourseStudents = async (event) => {
  const [students] = await db.query(
    `
    SELECT studentId
    FROM courseStudents
    WHERE courseId = ?
      AND status = 'active'
      AND deletedAt IS NULL
    `,
    [event.courseId]
  );

  for (const student of students) {
    await notificationService.createNotification({
      userId: student.studentId,
      type: "EVENT_CREATED",
      title: event.title || "Nuevo evento",
      referenceId: event.id,
      referenceType: "event",
      message: `Nuevo evento disponible: ${event.title || event.eventType}.`
    });
  }
};

const notifyAllActiveUsers = async (event) => {
  const [users] = await db.query(
    `
    SELECT id
    FROM users
    WHERE status = 'active'
      AND deletedAt IS NULL
    `
  );

  for (const user of users) {
    await notificationService.createNotification({
      userId: user.id,
      type: "EVENT_CREATED",
      title: event.title || "Nuevo evento",
      referenceId: event.id,
      referenceType: "event",
      message: `Nuevo evento disponible: ${event.title || event.eventType}.`
    });
  }
};

eventBus.on("EVENT_CREATED", async (event) => {
  try {
    if (event.courseId) {
      await notifyCourseStudents(event);
      return;
    }

    await notifyAllActiveUsers(event);
  } catch (error) {
    console.error("Error procesando EVENT_CREATED:", error.message);
  }
});
