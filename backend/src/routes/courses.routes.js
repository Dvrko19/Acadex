const express = require("express");
const router = express.Router();

const courseController = require("../controllers/courses.controller");


router.get("/", courseController.getAllCourses);

router.get("/:id", courseController.getCourseById);

router.post("/", courseController.createCourse);

router.put("/:id", courseController.updateCourse);

router.delete("/:id", courseController.deleteCourse);


router.post(
    "/:cursoId/student/:studentId",
    courseController.enrollStudentInCourse
);


module.exports = router;