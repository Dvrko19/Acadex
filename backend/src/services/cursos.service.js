const db = require('../config/db');

const findCourseById =  async (id) =>{
    const [rows] = await db.query(
        "SELECT * FROM courses WHERE id = ?",
        [id]
    )
    return rows[0];
}
const getCourses = async () =>{
    const [rows] = await db.query(
        `
        SELECT
            c.id
            c.descripcion
            c.profesor_id
            u.nombre as maestro
        From courses c
        INNER JOIN users u ON c.profesor_id = u.id
        WHERE u.rol = "profesor"
        `
    )
    return rows;
}
const createCourse = async ({nombre, descripcion, profesor_id}) =>{
    const [users] = await db.query(
        "SELECT * FROM users WHERE id = ? AND rol = 'profesro'",
        [estudianteId]
    );

    if(users === 0){
        throw new Error("Solo usuarios con rol maestro pueden ser asignados a un curso")
    }
    const [result] = await db.query(
        "INSERT INTO courses (nombre, descripcion, profesor_id) VALUES (?, ?, ?)",
        [nombre, descripcion, profesor_id]
    )
    return {
        id: result.insertId,
        nombre,
        descripcion,
        profesor_id
    }   
}
const deleteCourse = async (id)=>{
    const result = await db.query(
        "DELETE FROM courses WHERE id = ?",
        [id]
    )
    return result;
}
const updateCourses = async (id, {nombre, descripcion, profesor_id}) =>{
    const [result] = await db.query(
        `
         UPDATE courses
         set nombre = ?, descripcion = ?, profesor_id = ?
         WHERE id = ?
        `,
        [nombre, descripcion, profesor_id]
    )
    return result
}
const getCourseByTeacher = async (profesor_id) =>{
    const[rows] = await db.query(
        "SELECT * FROM courses WHERE profesor_id = ?",
        [profesor_id]
    )
    return rows
}
const enrollStudentInCourse = async ({cursoId, estudianteId}) =>{
    const [users] = await db.query(
        "SELECT * FROM usuarios WHERE id = ? AND rol = 'estudiante'",
        [estudianteId]
    );

    if (users.length === 0) {
        throw new Error("Solo se pueden inscribir usuarios con rol estudiante");
    }
    const[result] = await db.query(
        `
        INSERT INTO course_students
        (course_id, student_id)
        VALUES (?, ?)
        `,
        [cursoId, estudianteId]
    )
    return result;
}
const getStudentsByCourses = async (cursoId) => {
    const[rows] = await db.query (
        `
        SELECT
            u.id,
            u.nombre,
            u.email
        FROM course_students ce
        INNER JOIN users u
            ON ce.student_id = u.id
        WHERE ce.course_id = ?
        `,
        [cursoId]
    )
    return rows
}
const getCoursesByStudent = async (estudianteId) => {
    const [rows] = await db.query(
        `
        SELECT
            c.id,
            c.nombre,
            c.descripcion
        FROM course_students ce
        INNER JOIN cursos c
            ON ce.course_id = c.id
        WHERE ce.student_id = ?
        `,
        [estudianteId]
    );

    return rows;
};
const removeStudentFromCourse = async (cursoId, estudianteId) => {
    const [result] = await db.query(
        `
        DELETE FROM course_students
        WHERE curso_id = ? AND estudiante_id = ?
        `,
        [cursoId, estudianteId]
    );

    return result;
};
module.exports = {
    findCourseById,
    getCourses,
    createCourse,
    deleteCourse,
    updateCourses,
    getCourseByTeacher,
    enrollStudentInCourse,
    getStudentsByCourses,
    getCoursesByStudent,
    removeStudentFromCourse
};