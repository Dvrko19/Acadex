const tarea = require('./tasks.service');
const db = require('../config/db');

const findSubmissionById =  async (id) =>{
    const[rows] = await db.query(
        "SELECT * FROM submissions WHERE id = ?",
        [id]
    )
    return rows[0]
}

const getSubmission = async () =>{
    const [rows] = await db.query("SELECT * FROM submissions")
    return rows;
}
const getSubmissionByTasks = async(tarea) => {
    const[rows] = await db.query("SELECT * FROM submissions WHERE taskId = ?",
        [tarea]
    )
    return rows;
}
const getSubmissionByStudents = async(Estudiante) => {
    const[rows] = await db.query(
        "SELECT * FROM submissions WHERE studentId = ?",
        [Estudiante]
    )
    return rows;
}

const findStudentSubmissionForTask = async({taskId, studentId}) =>{
    const[rows] = await db.query(
        `SELECT *
        FROM submissions
        WHERE taskId = ? AND studentId = ?
        `,
        [taskId, studentId]
    )
    return rows[0];
}

//Esta funcion sirve para saber si una tarea es entregada tarde
const isLateSubmission = async(taskId) =>{
    const task = await tarea.getTaskById(taskId);

    return new Date() > new Date(task.fecha_entrega);
}

const createSubmission = async({taskId, studentId, fileUrl}) =>{
    const submissionExist = await findStudentSubmissionForTask({taskId, studentId});

    if(submissionExist){
        throw new Error("Este estudiante ya entrego la tarea");
    }//Esta condicional verifica que si el estudiate ya ha entregado su tarea

    const isLate = await isLateSubmission(taskId); //El uso de la funcion isLateSubmission

    const status = isLate ? "tardia" : "Entregada"; //Condicional para saber si la tarea ha sido entregada en tardanza

    const[result] = await db.query( 
        `
        INSERT INTO submissions
        (taskId, studentId, fileUrl, submittedAt, status)
        VALUES (?, ?, ?,now(), ?)
        `,
        [taskId, studentId, fileUrl, status]
    )
    return {
        id: result.insertId,
        taskId,
        studentId,
        fileUrl,
        status
    }
}
const updateSubmission = async(id, {fileUrl}) =>{
    const [result] = await db.query(
        `UPDATE submissions
        SET fileUrl = ?, submittedAt = now()
        WHERE id = ?
        `,
        [fileUrl, id]
    )
    return result;
}
const deleteSubmission = async(id) =>{
    const[result] = await db.query(
        "DELETE FROM submissions WHERE id = ?",
        [id]

    )
    return result;
}

module.exports ={
    findSubmissionById,
    getSubmission,
    getSubmissionByStudents,
    findStudentSubmissionForTask,
    isLateSubmission,
    createSubmission,
    updateSubmission,
    deleteSubmission,
    getSubmissionByTasks
}
