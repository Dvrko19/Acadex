const eventService = require("../services/events.service");
const { asyncHandler } = require("../helpers/errors");
const { requireFields, toInt } = require("../helpers/validators");

const getEvents = asyncHandler(async (req, res) => {
  const events = await eventService.getEvents(req.user);
  return res.status(200).json({ success: true, data: events });
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await eventService.findEventForUser(toInt(req.params.id), req.user);
  return res.status(200).json({ success: true, data: event });
});

const getEventsByUser = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin" && Number(req.params.userId) !== Number(req.user.userId)) {
    return res.status(403).json({
      success: false,
      message: "No puedes consultar eventos de otro usuario"
    });
  }

  const events = await eventService.findEventByUser(toInt(req.params.userId, "userId"));
  return res.status(200).json({ success: true, data: events });
});

const createEvent = asyncHandler(async (req, res) => {
  requireFields(req.body, ["eventType", "startDate"]);

  const event = await eventService.createEvent(
    {
      ...req.body,
      courseId: req.body.courseId ? toInt(req.body.courseId, "courseId") : null
    },
    req.user
  );

  return res.status(201).json({
    success: true,
    message: "Evento creado correctamente",
    data: event
  });
});

const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(toInt(req.params.id), req.user);
  return res.status(204).send();
});

module.exports = {
  getEvents,
  getEventById,
  getEventsByUser,
  createEvent,
  deleteEvent
};
