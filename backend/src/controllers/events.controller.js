const eventService = require("../services/eventos.service");

const getEvents = async (req, res) => {
    try {
        const events = await eventService.getEvents();

        return res.status(200).json({
            success: true,
            data: events
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener los eventos"
        });
    }
};

const getEventById = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await eventService.findEventById(id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Evento no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            data: event
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener el evento"
        });
    }
};

const getEventsByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const events = await eventService.findEventByUser(userId);

        return res.status(200).json({
            success: true,
            data: events
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener los eventos del usuario"
        });
    }
};

module.exports = {
    getEvents,
    getEventById,
    getEventsByUser
};