const express = require("express");
const router = express.Router();

const submissionController = require("../controllers/submissions.controller");
const {
  authenticateToken,
  authorizeRoles
} = require("../middlewares/auth.middleware");
const {
  uploadSubmissionFile
} = require("../middlewares/submission-upload.middleware");

router.get(
  "/my-submissions",
  authenticateToken,
  authorizeRoles("student"),
  submissionController.getMySubmissions
);

router.get(
  "/task/:taskId",
  authenticateToken,
  authorizeRoles("admin", "teacher"),
  submissionController.getSubmissionsByTasks
);

router.get(
  "/student/:studentId",
  authenticateToken,
  authorizeRoles("admin", "teacher", "student"),
  submissionController.getSubmissionsByStudents
);

router.patch(
  "/:submissionId/grade",
  authenticateToken,
  authorizeRoles("teacher"),
  submissionController.gradeSubmission
);

router.get(
  "/:submissionId/file",
  authenticateToken,
  authorizeRoles("admin", "teacher", "student"),
  submissionController.getSubmissionFile
);

router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin", "teacher"),
  submissionController.getSubmissions
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("student"),
  uploadSubmissionFile,
  submissionController.createSubmission
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("student"),
  uploadSubmissionFile,
  submissionController.updateSubmission
);

router.patch(
  "/:id",
  authenticateToken,
  authorizeRoles("student"),
  uploadSubmissionFile,
  submissionController.updateSubmission
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin", "teacher"),
  submissionController.deleteSubmission
);

module.exports = router;
