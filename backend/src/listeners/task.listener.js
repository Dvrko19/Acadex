const eventBus = require("../events/eventBus");
const notificationService = require("../services/notifications.service");
const courseService = require("../services/courses.service");

eventBus.on("TASK_CREATED", async (createdTask) => {
  try {
    const students = await courseService.getStudentsByCourses(createdTask.courseId);

    for (const student of students) {
      await notificationService.createNotification({
        userId: student.id,
        type: "task_created",
        title: "Nueva tarea",
        referenceId: createdTask.id,
        referenceType: "task",
        message: `Se creo una nueva tarea: ${createdTask.title}, con fecha de entrega: ${createdTask.dueDate}`
      });
    }
  } catch (error) {
    console.error("Error procesando TASK_CREATED:", error.message);
  }
});

eventBus.on("TASK_UPDATED", async (updatedTask) => {
  try {
    const students = await courseService.getStudentsByCourses(updatedTask.courseId);

    for (const student of students) {
      await notificationService.createNotification({
        userId: student.id,
        type: "task_created",
        title: "Tarea actualizada",
        referenceId: updatedTask.id,
        referenceType: "task",
        message: `La tarea "${updatedTask.title}" fue actualizada. Nueva fecha de entrega: ${updatedTask.dueDate}`
      });
    }
  } catch (error) {
    console.error("Error procesando TASK_UPDATED:", error.message);
  }
});

eventBus.on("TASK_DELETED", async (deletedTask) => {
  console.log(`Se ha desactivado la tarea con el ID: ${deletedTask.id}`);
});
