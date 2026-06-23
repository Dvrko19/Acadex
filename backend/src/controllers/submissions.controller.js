const SubmissionService = require('../services/entregas.service');

const getSubmissions = async(req, res) => {
    try {
        const submissions = await SubmissionService.getSubmission();

        return res.status(200).json({
            success: true,
            data: submissions
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener la entrega",
            error: error.message
        });
    }
}

const getSubmissionsByTasks = async(req, res) => {
    try {
        const {taskId} = req.params;

        const submissions = await SubmissionService.getSubmissionByTasks(taskId);

        return res.status(200).json({
            success: true,
            data: submissions
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener las entregas de la tarea",
            error: error.message
        });
    }
}

const getSubmissionsByStudents = async(req, res) => {
    try {
        const {studentId} = req.params;

        const submissions = await SubmissionService.getSubmissionByStudents(studentId);

        return res.status(200).json({
            success: true,
            data: submissions
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener las entregas del estudiante",
            error: error.message
        });
    }
}

const createSubmission = async(req, res) => {
    try {
        const {taskId, studentId, fileUrl} = req.body;

        if (!taskId || !studentId || !fileUrl) {
            return res.status(400).json({
                success: false,
                message: "tareaId, estudianteId y archivoUrl son obligatorios",

            });
        }

        const submission = await SubmissionService.createSubmission({
            taskId,
            studentId,
            fileUrl
        });

        return res.status(201).json({
            success: true,
            message: "Tarea entregada correctamente",
            data: submission
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

const updateSubmission = async(req, res) => {
    try {
        const {id} = req.params;
        const {fileUrl} = req.body;

        if(!fileUrl){
            return res.status(400).json({
                success: false,
                message: "archivoUrl es obligatorio"
            });
        }

        const result = await SubmissionService.updateSubmission(id, {fileUrl});

        if(result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Entrega no encontrada"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Entrega actualizada correctamente"
        })
    } catch (error) {
        return res.status(400).jso({
            success: false,
            message: error.message
        })   
    }
}

const deleteSubmission = async(req, res) => {
    try {
        const {id} = req.params;

        const result = await SubmissionService.deleteSubmission(id);

        if(result.affectedRows === 0){
            return res.status(404).json({
                success: false,
                message: "Entrega no encontrada"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Entrega eliminada correctamente"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

module.exports = {
    getSubmissions,
    getSubmissionsByTasks,
    getSubmissionsByStudents,
    createSubmission,
    updateSubmission,
    deleteSubmission

}