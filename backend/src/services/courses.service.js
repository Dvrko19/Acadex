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
            c.id,
            c.description,
            c.teacherId,
            u.name as teacher
        FROM courses c
        INNER JOIN users u ON c.teacherId = u.id
        WHERE u.role = "teacher"
        `
    )
    return rows;
}
const createCourse = async ({name, description, teacherId}) =>{
    const [users] = await db.query(
        "SELECT * FROM users WHERE id = ? AND role = 'teacher'",
        [teacherId]
    );

    if(users.length === 0){
        throw new Error("Solo usuarios con rol maestro pueden ser asignados a un curso")
    }
    const [result] = await db.query(
        "INSERT INTO courses (name, description, teacherId) VALUES (?, ?, ?)",
        [name, description, teacherId]
    )
    return {
        id: result.insertId,
        name,
        description,
        teacherId
    }   
}
const deleteCourse = async (id)=>{
    const result = await db.query(
        "DELETE FROM courses WHERE id = ?",
        [id]
    )
    return result;
}
const updateCourses = async (id, {name, description, teacherId}) =>{
    const [result] = await db.query(
        `
        UPDATE courses
        set name = ?, description = ?, teacherId = ?
        WHERE id = ?
        `,
        [name, description, teacherId, id]
    )
    return result
}
const getCourseByTeacher = async (teacherId) =>{
    const[rows] = await db.query(
        "SELECT * FROM courses WHERE teacherId = ?",
        [teacherId]
    )
    return rows
}
const enrollStudentInCourse = async ({courseId, studentId}) =>{
    const [users] = await db.query(
        "SELECT * FROM users WHERE id = ? AND role = 'student'",
        [studentId]
    );

    if (users.length === 0) {
        throw new Error("Solo se pueden inscribir usuarios con rol estudiante");
    }

    const [result] = await db.query(
        `
        INSERT INTO courseStudents
        (courseId, studentId)
        VALUES (?, ?)
        `,
        [courseId, studentId]
    );

    return result;
}
const getStudentsByCourses = async (courseId) => {
    const[rows] = await db.query (
        `
        SELECT
            u.id,
            u.name,
            u.email
        FROM courseStudents ce
        INNER JOIN users u
            ON ce.studentId = u.id
        WHERE ce.courseId = ?
        `,
        [courseId]
    )
    return rows
}
const getCoursesByStudent = async (studentId) => {
    const [rows] = await db.query(
        `
        SELECT
            c.id,
            c.name,
            c.description
        FROM courseStudents ce
        INNER JOIN courses c
            ON ce.courseId = c.id
        WHERE ce.studentId = ?
        `,
        [studentId]
    );

    return rows;
};
const removeStudentFromCourse = async (courseId, studentId) => {
    const [result] = await db.query(
        `
        DELETE FROM courseStudents
        WHERE courseId = ? AND studentId = ?
        `,
        [courseId, studentId]
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