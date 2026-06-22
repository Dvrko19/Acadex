const tarea = require('../services/tarea.service');
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
    const[rows] = await db.query("SELECT * FROM submissions WHERE tarea_id = ?",
        [tarea]
    )
    return rows;
}
const getSubmissionByStudents = async(Estudiante) => {
    const[rows] = await db.query(
        "SELECT * FROM submissions WHERE estudiante_id = ?",
        [Estudiante]
    )
    return rows;
}

const findStudentSubmissionForTask = async({tareaId, estudianteid}) =>{
    const[rows] = await db.query(
        `SELECT *
         FROM submissions
         WHERE tarea_id = ? AND estudiante_id = ?
        `,
        [tareaId, estudianteid]
    )
    return rows[0];
}

//Esta funcion sirve para saber si una tarea es entregada tarde
const isLateSubmission = async(tareaid) =>{
    const task = await tarea.getTaskById(tareaid);

    return new Date() > new Date(task.fecha_entrega);
}

const createSubmission = async({tareaId, estudianteid, archivUrl}) =>{
    const submissionExist = await findStudentSubmissionForTask(tareaId, estudianteid);

    if(submissionExist){
        throw new Error("Este estudiante ya entrego la tarea");
    }//Esta condicional verifica que si el estudiate ya ha entregado su tarea

    const isLate = await isLateSubmission(tareaId); //El uso de la funcion isLateSubmission

    const estado = isLate ? "tardia" : "Entregada"; //Condicional para saber si la tarea ha sido entregada en tardanza

    const[result] = await db.query( 
        `
        INSERT INTO submissions
        (tarea_id, estudiante_id, archivo_url, fecha_entrega, estado)
        VALUES (?, ?, ?,now(), ?)
        `,
        [tareaId, estudianteid, archivUrl, estado]
    )
    return {
        id: result.insertId,
        tareaId,
        estudianteid,
        archivUrl,
        estado
    }
}
const updateSubmission = async(id, {archivUrl}) =>{
    const [result] = await db.query(
        `UPDATE submissions
         SET archivo_url = ?, fecha_entrega = now()
         WHERE id = ?
        `,
        [archivUrl, id]
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
