const db = require("../config/db")

const createEvent = async ({tipo_evento, usuario_id, datos, fechas}) =>{
    const [result] = await db.query(
        "INSERT INTO events (tipo_evento, usuario_id, datos, fecha) VALUES (?, ?, ?, ?)",
        [tipo_evento, usuario_id, datos, fechas]
    )
    return{
        id: result.insertId,
        tipo_evento,
        usuario_id,
        datos,
        fechas
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
const findEventByType = async (tipo) => {
    const[rows] = await db.query (
        "SELECT * FROM events WHERE tipo_evento = ?",
        [tipo]
    )
    return rows
}
const findEventByUser = async (usuario_id) => {
     const[rows] = await db.query (
        "SELECT * FROM events WHERE usuario_id = ?",
        [usuario_id]
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