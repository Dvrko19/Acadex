const eventBus = require("../events/eventBus");
const notificationsServices = require("../services/notifications.service");
const courseService = require("../services/courses.service");

//listener para el evento de usuario creado 
eventBus.on("task.created", async (createdTask) => {
    try {
        // Obtener todos los estudiantes inscritos en el curso
        const students = await courseService.getStudentsByCourses(
            createdTask.courseId
        );

        // Crear una notificación para cada estudiante
        for (const student of students) {
            await notificationService.createNotification({
                userId: student.id,
                message: `Se creó una nueva tarea: ${createdTask.title}, con fecha de entrega: ${createdTask.dueDate}`
            });
        }

        console.log(
            `Se crearon ${students.length} notificaciones para la tarea "${createdTask.title}".`
        );

    } catch (error) {
        console.error(
            "Error procesando task.created:",
            error.message
        );
    }
});






//listener para el evento de tarea actualizada
eventBus.on("task.updated", async (updatedTask) => {
    try {
        // Obtener todos los estudiantes inscritos en el curso
        const students = await courseService.getStudentsByCourses(
            updatedTask.courseId
        );

        // Crear una notificación para cada estudiante
        for (const student of students) {
            await notificationService.createNotification({
                userId: student.id,
                message: `La tarea "${updatedTask.title}" fue actualizada. Nueva fecha de entrega: ${updatedTask.dueDate}`
            });
        }

        console.log(
            `Se notificó a ${students.length} estudiantes sobre la actualización de la tarea "${updatedTask.title}".`
        );

    } catch (error) {
        console.error(
            "Error procesando task.updated:",
            error.message
        );
    }
});




//listener para el evento de tarea eliminada
eventBus.on("task.deleted ",async deletedTask => {
    console.log(`Se ha eliminado la tarea con el ID: ${deletedTask.id}`);
})


