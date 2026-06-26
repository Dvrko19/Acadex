const db = require("../config/db")

const createEvent = async ({eventType, userId, data}) =>{
    const [result] = await db.query(
        "INSERT INTO events (eventType, userId, data) VALUES (?, ?, ?)",
        [eventType, userId, JSON.stringify(data)]
    )//Borramos el parametro "CreatedAt" porque el MySQL crea eso de manera automatica en la base de datos.
    return{
        id: result.insertId,
        eventType,
        userId,
        data
        
    }
}
const getEvents = async()=>{
    const [rows] = await db.query(
        "SELECT * FROM events"
    )
    return rows;
}
const findEventById = async (id)=>{
    const[rows] = await db.query (
        "SELECT * FROM events WHERE id = ?",
        [id]
    )
    return rows[0]
}
const findEventByType = async (eventType) => {
    const[rows] = await db.query (
        "SELECT * FROM events WHERE eventType = ?",
        [eventType]
    )
    return rows
}
const findEventByUser = async (userId) => {
    const[rows] = await db.query (
        "SELECT * FROM events WHERE userId = ?",
        [userId]
    )
    return rows;
}
const deleteEvent = async (id) => {
    const [result] = await db.query(
        "DELETE FROM events WHERE id = ?",
        [id]
    )
    return result
}
module.exports = {
    createEvent,
    getEvents,
    findEventById,
    findEventByType,
    findEventByUser,
    deleteEvent
}//No se exportaban correctamente las funciones.