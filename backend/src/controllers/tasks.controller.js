const tareaService = require("../services/tarea.service");

const getTasks = async (req, res) => {
    try {
        const tasks = await tareaService.getTask();

        return res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener las tareas",
            error: error.message
        });
    }
};

const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;

        const task = await tareaService.getTaskById(id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Tarea no encontrada"
            });
        }

        return res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener la tarea",
            error: error.message
        });
    }
};

const createTask = async (req, res) => {
    try {
        const {
            id_curso,
            title,
            description,
            dateE
        } = req.body;

        if (!id_curso || !title || !dateE) {
            return res.status(400).json({
                success: false,
                message: "id_curso, title y dateE son obligatorios"
            });
        }

        const task = await tareaService.createTask({
            id_curso,
            title,
            description,
            dateE
        });

        return res.status(201).json({
            success: true,
            message: "Tarea creada correctamente",
            data: task
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            id_curso,
            title,
            description,
            dateE
        } = req.body;

        const taskExists = await tareaService.taskExist(id);

        if (!taskExists) {
            return res.status(404).json({
                success: false,
                message: "Tarea no encontrada"
            });
        }

        const result = await tareaService.updateTask(id, {
            id_curso,
            title,
            description,
            dateE
        });

        return res.status(200).json({
            success: true,
            message: "Tarea actualizada correctamente",
            affectedRows: result.affectedRows
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await tareaService.deleteTask(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Tarea no encontrada"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Tarea eliminada correctamente"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al eliminar la tarea",
            error: error.message
        });
    }
};

const getTasksByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const tasks = await tareaService.getTaskByCourse(courseId);

        return res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener las tareas del curso",
            error: error.message
        });
    }
};

const getPendingTasks = async (req, res) => {
    try {
        const tasks = await tareaService.getTasksPending();

        return res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener las tareas pendientes",
            error: error.message
        });
    }
};

const getExpiredTasks = async (req, res) => {
    try {
        const tasks = await tareaService.getExpiredTasks();

        return res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener las tareas vencidas",
            error: error.message
        });
    }
};

const searchTasksByTitle = async (req, res) => {
    try {
        const { title } = req.query;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Debes enviar el título que deseas buscar"
            });
        }

        const tasks = await tareaService.findTaskByTitle(title);

        return res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al buscar las tareas",
            error: error.message
        });
    }
};

const countTasks = async (req, res) => {
    try {
        const result = await tareaService.countTasks();

        return res.status(200).json({
            success: true,
            total: result.total
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al contar las tareas",
            error: error.message
        });
    }
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    getTasksByCourse,
    getPendingTasks,
    getExpiredTasks,
    searchTasksByTitle,
    countTasks
};