const notificationService = require('../services/notifications.service');

const getMyNotifications = async(req, res) => {
    try {
        const userId = req.user.id

        const notifications = await notificationService.getNotificationByuser(userId);

        return res.status(200).json({
            success: true,
            data: notifications
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener las notificaciones"
        });
    }
}

const markAsRead = async(req, res) => {
    try {
        const {id} = req.params;

        const result = await notificationService.markAsRead(id);

        if(result.affectedRows === 0){
            return res.status(404).json({
                success: false,
                message: "Notificación no encontrada"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notificación marcada como leída"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al actualizar la notificación",
            error: error.message
        });
    }
}

const deleteNotification = async(req, res) => {
    try {
        const {id} = req.params;

        const result = await notificationService.deleteNotification(id);
    
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Notificación no encontrada"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notificación eliminada"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al eliminar la notificación",
            error: error.message
        });
    }
}

module.exports = {
    getMyNotifications,
    markAsRead,
    deleteNotification
};