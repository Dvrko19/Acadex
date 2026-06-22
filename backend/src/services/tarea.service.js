const db = require('../config/db');


const getTaskById = async (id)=>{
    const[rows] = await db.query(
        "SELECT * FROM tasks WHERE id = ?",
        [id]
    );
    return rows[0];
}
const getTask = async () =>{
    const[rows] = await db.query(
        "SELECT * FROM tareas"
    )
    return rows;
}
const createTask = async ({id_curso, title, description, dateE}) =>{
    
    const[result] = await db.query(
        "INSERT INTO tasks (curso_id, titulo, descripcion, fecha_entrega) VALUES (?, ?, ?, ?)",
        [id_curso, title, description, dateE]
    )
    return {
        id: result.insertId,
        id_curso,
        title,
        description,
        dateE
    }
}
const updateTask = async (id,{id_curso, title, description, dateE}) =>{
    const[result] = await db.query(
        `UPDATE tasks
         set curso_id = ?, titulo = ?, descripcion = ?, fecha_entrega = ?
         WHERE id = ?
        `,
        [id_curso, title, description, dateE, id]
    )
    return result;
}
const deleteTask = async (id) =>{
    const [result] = await db.query(
        "DELETE FROM tasks WHERE id = ?",
        [id]
    );
    return result;
}

const getTaskByCourse = async ({id_curso}) =>{
    const[rows] = await db.query(
        "SELECT * FROM tasks WHERE curso_id"
    );
    return rows;
}

const getTasksPending = async () =>{
    const[rows] = await db.query(
        `
        SELECT *
        FROM tasks
        WHERE fecha_entrega >= CURDATE()
        `
    )
    return rows;
}
const getExpiredTasks = async() =>{
    const[rows] = await db.query(
        `
        SELECT *
        FROM tasks
        WHERE fecha_entrega < CURDATE()
        `
    )
    return rows;
}
const taskExist = async (id) =>{
    const [rows] = await db.query(
        "SELECT id FROM tasks WHERE id = ?",
        [id]
    )
    return rows.length > 0;
}
const findTaskByTitle = async ({title}) =>{
    const[rows] = await db.query(
        "SELECT * FROM tasks WHERE titulo like ?",
        [`%${title}%`]
    )
    return rows;
}
const countTasks = async () =>{
    const[rows] = await db.query(
        "SELECT COUNT(*) AS total FROM tasks"
    )
    return rows[0];
}

module.exports = {
    getTask,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    getTaskByCourse,
    getTasksPending,
    getExpiredTasks,
    taskExist,
    findTaskByTitle,
    countTasks
}