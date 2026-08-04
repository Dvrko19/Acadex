const taskService = require("../services/tasks.service");
const submissionService = require("../services/submissions.service");
const { asyncHandler } = require("../helpers/errors");
const { requireFields, toInt, parseOptionalNumber } = require("../helpers/validators");
const { parseIsoDate } = require("../helpers/dates");

const normalizeTaskBody = (body) => ({
  courseId: body.courseId || body.id_curso,
  title: body.title,
  description: body.description,
  dueDate: body.dueDate || body.dateE,
  maxScore: parseOptionalNumber(body.maxScore, "maxScore"),
  status: body.status
});

const getTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTasks(req.user);
  return res.status(200).json({ success: true, data: tasks });
});

const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.assertCanAccessTask(toInt(req.params.id), req.user);
  return res.status(200).json({ success: true, data: task });
});

const createTask = asyncHandler(async (req, res) => {
  const taskBody = normalizeTaskBody(req.body);
  requireFields(taskBody, ["courseId", "title", "dueDate"]);

  const task = await taskService.createTask(
    {
      ...taskBody,
      courseId: toInt(taskBody.courseId, "courseId"),
      dueDate: parseIsoDate(taskBody.dueDate)
    },
    req.user
  );

  return res.status(201).json({
    success: true,
    message: "Tarea creada correctamente",
    data: task
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const taskBody = normalizeTaskBody(req.body);
  const result = await taskService.updateTask(
    toInt(req.params.id),
    {
      ...taskBody,
      courseId: taskBody.courseId ? toInt(taskBody.courseId, "courseId") : undefined,
      dueDate: taskBody.dueDate ? parseIsoDate(taskBody.dueDate) : undefined
    },
    req.user
  );

  return res.status(200).json({
    success: true,
    message: "Tarea actualizada correctamente",
    data: result
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(toInt(req.params.id), req.user);
  return res.status(204).send();
});

const getTasksByCourse = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTaskByCourse(
    toInt(req.params.courseId, "courseId"),
    req.user
  );

  return res.status(200).json({ success: true, data: tasks });
});

const getPendingTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getPendingTasks(req.user);
  return res.status(200).json({ success: true, data: tasks });
});

const getExpiredTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getExpiredTasks();
  return res.status(200).json({ success: true, data: tasks });
});

const searchTasksByTitle = asyncHandler(async (req, res) => {
  const { title } = req.query;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: "Debes enviar el titulo que deseas buscar"
    });
  }

  const tasks = await taskService.findTaskByTitle(title, req.user);
  return res.status(200).json({ success: true, data: tasks });
});

const countTasks = asyncHandler(async (req, res) => {
  const result = await taskService.countTasks();
  return res.status(200).json({ success: true, total: result.total });
});

const getTaskSubmissions = asyncHandler(async (req, res) => {
  const submissions = await submissionService.getSubmissionsByTaskForReviewer(
    toInt(req.params.taskId, "taskId"),
    req.user,
    req.query.status
  );

  return res.status(200).json({ success: true, data: submissions });
});

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
  countTasks,
  getTaskSubmissions
};
