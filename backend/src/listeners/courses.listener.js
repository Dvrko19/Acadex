const eventBus = require("../events/eventBus");
const notificationService = require("../services/notifications.service");



//listener para el evento de curso creado
eventBus.on("course.created", async (createdCourse) => {
        await notificationService.createNotification({
            userId: createdCourse.teacherId,
            message: `Se te asigno un nuevo curso: ${createdCourse.name},. `
        });
});




//listener para el evento de curso eliminado
eventBus.on("course.deleted", async (deletedCourse) => {
    console.log(`El curso ${deletedCourse.id} fue eliminado.`);
});



//listener para el evento de curso actualizado
eventBus.on("course.updated", async (updatedCourses) => {
        await notificationService.createNotification({
            userId: updatedCourses.teacherId,
            message: `Se te actualizo el curso: ${updatedCourses.name},. `
        });
});



//listner para el evento de estudiante inscrito a un curso
eventBus.on("course.enroll", async (enrollment) => {
    try {
        await notificationService.createNotification({
            userId: enrollment.studentId,
            message: `Te inscribiste correctamente en el curso.`
        });

        console.log("Notificación creada");
    } catch (error) {
        console.error(error.message);
    }
});



//listener para el evento de estudiante desinscrito de un curso
eventBus.on("course.removedStudentFromCourse", async (removedStudent) => {
    try {
    await notificationService.createdCourse({
        userId: removedStudent.studentId,
        message: `Has sido eliminado del curso.`
    });

        console.log("Notificación creada");
    } catch (error) {
        console.error(error.message);
    }
})





