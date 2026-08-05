const eventBus = require("../events/eventBus");
const db = require("../config/db");
const notificationService = require("../services/notifications.service");

const getTaskTeacherId = async (taskId) => {
  const [rows] = await db.query(
    `
    SELECT c.teacherId
    FROM tasks t
    INNER JOIN courses c ON t.courseId = c.id
    WHERE t.id = ?
    `,
    [taskId]
  );
  return rows[0]?.teacherId;
};

eventBus.on("SUBMISSION_CREATED", async (createdSubmission) => {
  try {
    const teacherId = await getTaskTeacherId(createdSubmission.taskId);

    await notificationService.createNotification({
      userId: createdSubmission.studentId,
      type: "submission_created",
      title: "Entrega registrada",
      referenceId: createdSubmission.id,
      referenceType: "submission",
      message: `Tu entrega para la tarea ${createdSubmission.taskId} fue registrada correctamente.`
    });

    if (teacherId) {
      await notificationService.createNotification({
        userId: teacherId,
        type: "submission_created",
        title: "Nueva entrega",
        referenceId: createdSubmission.id,
        referenceType: "submission",
        message: `Hay una nueva entrega pendiente de revision para la tarea ${createdSubmission.taskId}.`
      });
    }
  } catch (error) {
    console.error("Error procesando SUBMISSION_CREATED:", error.message);
  }
});

eventBus.on("SUBMISSION_UPDATED", async (updatedSubmission) => {
  try {
    const teacherId = await getTaskTeacherId(updatedSubmission.taskId);

    await notificationService.createNotification({
      userId: updatedSubmission.studentId,
      type: "submission_created",
      title: "Entrega actualizada",
      referenceId: updatedSubmission.id,
      referenceType: "submission",
      message: `Tu entrega ${updatedSubmission.id} fue actualizada.`
    });

    if (teacherId) {
      await notificationService.createNotification({
        userId: teacherId,
        type: "submission_created",
        title: "Entrega actualizada",
        referenceId: updatedSubmission.id,
        referenceType: "submission",
        message: `Una entrega de la tarea ${updatedSubmission.taskId} fue actualizada.`
      });
    }
  } catch (error) {
    console.error("Error procesando SUBMISSION_UPDATED:", error.message);
  }
});

eventBus.on("SUBMISSION_GRADED", async (gradedSubmission) => {
  try {
    await notificationService.createNotification({
      userId: gradedSubmission.studentId,
      type: "submission_graded",
      title: "Entrega calificada",
      referenceId: gradedSubmission.id,
      referenceType: "submission",
      message: `Tu entrega ${gradedSubmission.id} fue calificada con ${gradedSubmission.grade}.`
    });
  } catch (error) {
    console.error("Error procesando SUBMISSION_GRADED:", error.message);
  }
});

eventBus.on("SUBMISSION_DELETED", async (deletedSubmission) => {
  console.log(`La entrega ${deletedSubmission.id} fue desactivada.`);
});

eventBus.on("FILE_SCAN_REJECTED", async ({ submissionId }) => {
  try {
    const [rows] = await db.query(
      "SELECT studentId FROM submissions WHERE id = ?",
      [submissionId]
    );
    if (!rows[0]) return;
    await notificationService.createNotification({
      userId: rows[0].studentId,
      type: "FILE_SCAN_REJECTED",
      title: "Archivo rechazado",
      referenceId: submissionId,
      referenceType: "submission_file_scan",
      message: "El archivo de tu entrega no supero la validacion automatica."
    });
  } catch (error) {
    console.error("Error procesando FILE_SCAN_REJECTED:", error.message);
  }
});
