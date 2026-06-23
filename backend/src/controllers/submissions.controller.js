const entregaService = require('../services/entregas.service');

const getSubmissions = async(req, res) => {
    try {
        const submissions = await entregaService.getSubmission();

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

        const submissions = await entregaService.getSubmissionByTasks(taskId);

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

        const submissions = await entregaService.getSubmissionByStudents(studentId);

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
        const {tareaId, studentId, archivoUrl} = req.body;

        if (!tareaId || !studentId || !archivoUrl) {
            return res.status(400).json({
                success: false,
                message: "tareaId, estudianteId y archivoUrl son obligatorios",

            });
        }

        const submission = await entregaService.createSubmission({
            tareaId,
            studentId,
            archivUrl
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
        const {archivoUrl} = req.body;

        if(!archivoUrl){
            return res.status(400).json({
                success: false,
                message: "archivoUrl es obligatorio"
            });
        }

        const result = await entregaService.updateSubmission(id, {archivUrl});

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

        const result = await entregaService.deleteSubmission(id);

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