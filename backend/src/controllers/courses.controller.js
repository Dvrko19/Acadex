const courseService = require('../services/courses.service');

const getAllCourses = async(req, res) => {
    try {
        const courses = await courseService.getCourses();

        return res.status(200).json({
            success: true,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


const getCourseById = async(req, res,) => {
    try {
        const course = await courseService.findCourseById(req.params.id);

        if(!course){
            return res.status(404).json({
                success: false,
                message: "Curso no encontrado."
            });
        }

        return res.status(200).json({
            success: true,
            data: course
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const createCourse = async(req, res,) => {
    try {
        const newCourse = await courseService.createCourse(req.body)

        return res.status(201).json({
            success: true,
            message: "Curso creado correctamente",
            data: newCourse
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

const updateCourse = async(req, res,) => {
    try {
        const result = await courseService.updateCourses(
            req.params.id,
            req.body
        );

        if(result.affectedRows === 0 ){
            return res.status(404).json({
                success: false,
                message: "Curso no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Curso actualizado correctamente"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

const deleteCourse = async(req, res) => {
    try {
        const result = await courseService.deleteCourse(req.params.id);

        if(result.affectedRows === 0){
            return res.status(404).json({
                success: false,
                massage: "Curso no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Curso eliiminado correctamente"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const enrollStudentInCourse = async(req, res) => {
    try {
        const result = await courseService.enrollStudentInCourse({
            cursoId: req.params.cursoId,
            studentId: req.params.studentId
        });

        return res.status(201).json({
            success: true,
            message: "Estudiante inscrito correctamente",
            data: result
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })   
    }
}

module.exports = {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollStudentInCourse
}