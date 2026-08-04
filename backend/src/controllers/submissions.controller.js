const submissionService = require("../services/submissions.service");
const { asyncHandler } = require("../helpers/errors");
const { requireFields, toInt } = require("../helpers/validators");

const getSubmissions = asyncHandler(async (req, res) => {
  const submissions = await submissionService.getSubmissionsForUser(req.user);
  return res.status(200).json({ success: true, data: submissions });
});

const getSubmissionsByTasks = asyncHandler(async (req, res) => {
  const submissions = await submissionService.getSubmissionsByTaskForReviewer(
    toInt(req.params.taskId, "taskId"),
    req.user,
    req.query.status
  );

  return res.status(200).json({ success: true, data: submissions });
});

const getSubmissionsByStudents = asyncHandler(async (req, res) => {
  const studentId = toInt(req.params.studentId, "studentId");
  const submissions = await submissionService.getSubmissionsByStudentForUser(
    studentId,
    req.user
  );
  return res.status(200).json({ success: true, data: submissions });
});

const getMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await submissionService.getSubmissionByStudents(req.user.userId);
  return res.status(200).json({ success: true, data: submissions });
});

const createSubmission = asyncHandler(async (req, res) => {
  requireFields(req.body, ["taskId"]);

  const submission = await submissionService.createSubmission({
    taskId: toInt(req.body.taskId, "taskId"),
    studentId: req.user.userId,
    file: req.file
  });

  return res.status(201).json({
    success: true,
    message: "Tarea entregada correctamente",
    data: submission
  });
});

const updateSubmission = asyncHandler(async (req, res) => {
  const result = await submissionService.replaceSubmission(
    toInt(req.params.id),
    { file: req.file },
    req.user
  );

  return res.status(200).json({
    success: true,
    message: "Entrega actualizada correctamente",
    data: result
  });
});

const getSubmissionFile = asyncHandler(async (req, res, next) => {
  const file = await submissionService.getSubmissionFile(
    toInt(req.params.submissionId, "submissionId"),
    req.user
  );
  const inline = file.fileExtension === "pdf";
  const fallbackName = String(file.originalFileName || `submission.${file.fileExtension}`)
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  const encodedName = encodeURIComponent(file.originalFileName || fallbackName)
    .replace(/['()*]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    );

  res.set({
    "Content-Type": file.mimeType,
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store"
  });
  file.stream.on("error", next);
  file.stream.pipe(res);
});

const gradeSubmission = asyncHandler(async (req, res) => {
  requireFields(req.body, ["grade"]);

  const result = await submissionService.gradeSubmission(
    toInt(req.params.submissionId, "submissionId"),
    {
      grade: req.body.grade,
      feedback: req.body.feedback
    },
    req.user
  );

  return res.status(200).json({
    success: true,
    message: "Entrega calificada correctamente",
    data: result
  });
});

const deleteSubmission = asyncHandler(async (req, res) => {
  await submissionService.deleteSubmission(toInt(req.params.id), req.user);
  return res.status(204).send();
});

module.exports = {
  getSubmissions,
  getSubmissionsByTasks,
  getSubmissionsByStudents,
  getMySubmissions,
  createSubmission,
  updateSubmission,
  getSubmissionFile,
  gradeSubmission,
  deleteSubmission
};
