const db = require("../config/db");
const eventBus = require("../events/eventBus");

const createNotification = async ({userId, message})=>{
    const[result] = await db.query(
        "INSERT INTO notifications (userId, message) VALUES (?, ?)",
        [userId, message]
    )
    const createdNotification = {
        id: result.insertId,
        userId,
        message,
        isRead: false
    }
    eventBus.emit("Notification.created", createdNotification)
    return createdNotification
}
const getNotification = async () => {
    const[rows] = await db.query (
        "SELECT * FROM notifications"
    )
    return rows;
}
const findNotificationById = async (id) => {
    const[rows] = await db.query (
        "SELECT * FROM notifications WHERE id = ?",
        [id]
    )
    return rows[0];
}
const getNotificationByuser = async (userId) => {
    const[rows] = await db.query(
        "SELECT * FROM notifications WHERE userId = ?",
        [userId]
    )
    return rows;
}
const markAsRead = async (id) => {
    const[result] = await db.query(
        `
        UPDATE notifications
        SET isRead = true
        WHERE id = ?
        `,
        [id]
    )
    return result
}
const deleteNotification = async (id) => {
    const[result] = await db.query(
        "DELETE FROM notifications WHERE id = ?",
        [id]
    )
    if(result.affectedRows === 0){
        throw new Error("Notificacion no encontrada")
    }
    const deletedNotification = {
        id
    }
    eventBus.emit("notification.deleted", deletedNotification);
    return deletedNotification;
}
module.exports = {
    createNotification,
    getNotification,
    findNotificationById,
    getNotificationByuser,
    markAsRead,
    deleteNotification
}