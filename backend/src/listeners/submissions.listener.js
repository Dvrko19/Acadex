const eventBus = require("../events/eventBus");
const notificationService = require("../services/notifications.service");
const courseService = require("../services/courses.service");


//listener para el evento de entrega de tarea creada
eventBus.on("Submissions.created", async (createdSubmission) => {
    try{
        const students = await courseServices.getStudentsByCourses(
            createdSubmission.courseId
        );


        // Crear una notificación para cada estudiante
        for(const student of students){
            await notificationService.createNotification({
                userId: student.id,
                message: `Se creó una nueva entrega de tarea: ${createdSubmission.title}, con fecha de entrega: ${createdSubmission.dueDate}`
            });
        }
        // Loguear la cantidad de notificaciones creadas
        console.log(
            `Se notificó a ${students.length} estudiantes sobre la nueva entrega de tarea "${createdSubmission.title}".`
        )
    }catch(error){
        console.error(`Lo sentimos, ocurrió un error al subir la entrega de la tarea: ${error.message}`);
    }
})




//listener para el evento de entrega de tarea actualizada

eventBus.on("submission.updated", async (updatedSubmission) => {
    try {
        console.log(
            `La entrega ${updatedSubmission.id} fue actualizada.`
        );

        //Nota falta mas informacion de parte del services ya que no se tiene informacion de quien actulizo la entrega.

    } catch (error) {
        console.error(
            "Error procesando submission.updated:",
            error.message
        );
    }
});



//listener para el evento de entrega de tarea eliminada

eventBus.on("Submissions.deleted", deletedSubmision =>{
    console.log(`La entrega ${deletedSubmision.id} fue eliminada.`)
})




