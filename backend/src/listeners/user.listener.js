const eventBus = requiered("..events/eventBus");
const notificationsServices = require("../services/notifications.service");


//listener para el evento de usuario creado
eventBus.on("user.created", async (createdUser) =>{

    try{
        const notifications = 
            await notificationsServices.createNotification({
                usertId: createdUser.id,
                message: `Bienvenido ${createdUser.name}, tu usuario fue creado correctamente`
            });

        console.log("Notification creada: ", notifications);
    }catch(error) {
        console.error(
            "error al crear la notificacion:",
            error.message
        )
    }
});


//listener para el evento de usuario eliminado
eventBus.on("user.deleted",  async (deleteUser) => {
    console.log(`Se ha eliminado el usuario con el ID:${deleteUser.id}`);
});



//listener para el evento de usuario actulizado

eventBus.on("user.updated", async (updated) =>{
    try{
        const notifications = 
            await notificationsServices.createNotification({
                usertId: updated.id,
                message: `Hola ${updated.name}, tu usuario fue actualizado correctamente`
            });

        console.log("Notification creada: ", notifications);
    }catch(error) {
        console.error(
            "error al crear la notificacion:",
            error.message
        )
    }
})

