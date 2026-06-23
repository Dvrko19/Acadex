const express = require("express");
const router = express.Router();

const submissionController =
require("../controllers/submission.controller");


router.get(
    "/",
    submissionController.getSubmissions
);


router.get(
    "/task/:taskId",
    submissionController.getSubmissionsByTasks
);


router.get(
    "/student/:studentId",
    submissionController.getSubmissionsByStudents
);


router.post(
    "/",
    submissionController.createSubmission
);


router.put(
    "/:id",
    submissionController.updateSubmission
);


router.delete(
    "/:id",
    submissionController.deleteSubmission
);


module.exports = router;