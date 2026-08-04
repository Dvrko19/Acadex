const eventBus = require("../events/eventBus");
const notificationService = require("../services/notifications.service");

eventBus.on("USER_CREATED", async (createdUser) => {
  try {
    await notificationService.createNotification({
      userId: createdUser.id,
      type: "general",
      title: "Cuenta creada",
      referenceId: createdUser.id,
      referenceType: "user",
      message: `Bienvenido ${createdUser.name}, tu usuario fue creado correctamente.`
    });
  } catch (error) {
    console.error("Error procesando USER_CREATED:", error.message);
  }
});

eventBus.on("USER_DEACTIVATED", async (deletedUser) => {
  console.log(`Se ha desactivado el usuario con el ID: ${deletedUser.id}`);
});

eventBus.on("USER_UPDATED", async (updatedUser) => {
  try {
    await notificationService.createNotification({
      userId: updatedUser.id,
      type: "general",
      title: "Cuenta actualizada",
      referenceId: updatedUser.id,
      referenceType: "user",
      message: `Hola ${updatedUser.name}, tu usuario fue actualizado correctamente.`
    });
  } catch (error) {
    console.error("Error procesando USER_UPDATED:", error.message);
  }
});
