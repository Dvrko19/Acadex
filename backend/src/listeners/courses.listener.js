const eventBus = require("../events/eventBus");
const notificationService = require("../services/notifications.service");

eventBus.on("COURSE_CREATED", async (createdCourse) => {
  try {
    await notificationService.createNotification({
      userId: createdCourse.teacherId,
      type: "course_updated",
      title: "Nuevo curso asignado",
      referenceId: createdCourse.id,
      referenceType: "course",
      message: `Se te asigno un nuevo curso: ${createdCourse.name}.`
    });
  } catch (error) {
    console.error("Error procesando COURSE_CREATED:", error.message);
  }
});

eventBus.on("COURSE_DEACTIVATED", async (deletedCourse) => {
  console.log(`El curso ${deletedCourse.id} fue desactivado.`);
});

eventBus.on("COURSE_UPDATED", async (updatedCourse) => {
  try {
    await notificationService.createNotification({
      userId: updatedCourse.teacherId,
      type: "course_updated",
      title: "Curso actualizado",
      referenceId: updatedCourse.id,
      referenceType: "course",
      message: `Se actualizo el curso: ${updatedCourse.name}.`
    });
  } catch (error) {
    console.error("Error procesando COURSE_UPDATED:", error.message);
  }
});

eventBus.on("COURSE_ENROLLMENT_CREATED", async (enrollment) => {
  try {
    await notificationService.createNotification({
      userId: enrollment.studentId,
      type: "COURSE_ENROLLMENT_CREATED",
      title: "Inscripcion activa",
      referenceId: enrollment.courseId,
      referenceType: "enrollment",
      message: "Te inscribiste correctamente en el curso."
    });
  } catch (error) {
    console.error("Error procesando COURSE_ENROLLMENT_CREATED:", error.message);
  }
});

eventBus.on("COURSE_ENROLLMENT_DEACTIVATED", async (removedStudent) => {
  try {
    await notificationService.createNotification({
      userId: removedStudent.studentId,
      type: "course_updated",
      title: "Inscripcion desactivada",
      referenceId: removedStudent.courseId,
      referenceType: "course",
      message: "Has sido eliminado del curso."
    });
  } catch (error) {
    console.error("Error procesando COURSE_ENROLLMENT_DEACTIVATED:", error.message);
  }
});
