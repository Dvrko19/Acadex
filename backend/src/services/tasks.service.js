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
        "SELECT * FROM tasks"
    )
    return rows;
}
const createTask = async ({courseId, title, description, dueDate}) =>{
    
    const[result] = await db.query(
        "INSERT INTO tasks (courseId, title, description, dueDate) VALUES (?, ?, ?, ?)",
        [courseId, title, description, dueDate]
    )
    return {
        id: result.insertId,
        courseId,
        title,
        description,
        dueDate
    }
}
const updateTask = async (id,{courseId, title, description, dueDate}) =>{
    const[result] = await db.query(
        `UPDATE tasks
        set courseId = ?, title = ?, description = ?, dueDate = ?
        WHERE id = ?
        `,
        [courseId, title, description, dueDate, id]
    )//Unos de los campos (courseId) no estaba escrito correctamente (curso_id).
    return result;
}
const deleteTask = async (id) =>{
    const [result] = await db.query(
        "DELETE FROM tasks WHERE id = ?",
        [id]
    );
    return result;
}

const getTaskByCourse = async ({courseId}) =>{
    const[rows] = await db.query(
        "SELECT * FROM tasks WHERE courseId = ?",
        [courseId]
    );
    return rows;
}

const getTasksPending = async () =>{
    const[rows] = await db.query(
        `
        SELECT *
        FROM tasks
        WHERE dueDate >= CURDATE()
        `
    )
    return rows;
}
const getExpiredTasks = async() =>{
    const[rows] = await db.query(
        `
        SELECT *
        FROM tasks
        WHERE dueDate < CURDATE()
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
        "SELECT * FROM tasks WHERE title like ?",
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