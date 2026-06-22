const db = require("../config/db");

const createNotification = async ({usuario_id, mensaje})=>{
    const[result] = await db.query(
        "INSERT INTO notifications (usuario_id, mensaje) VALUES (?, ?)",
        [usuario_id, mensaje]
    )
    return {
        id: result.insertId,
        usuario_id,
        mensaje,
        leida: false
    }
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
const getNotificationByuser = async (user_id) => {
    const[rows] = await db.query(
        "SELECT * FROM notifications WHERE usuario_id = ?",
        [user_id]
    )
    return rows;
}
const markAsRead = async (id) => {
    const[result] = await db.query(
        `
        UPDATE notifications
        SET leida = true
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
    return result;
}
module.exports = {
    createNotification,
    getNotification,
    findNotificationById,
    getNotificationByuser,
    markAsRead,
    deleteNotification
}