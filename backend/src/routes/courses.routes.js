const express = require("express");
const router = express.Router();

const courseController = require("../controllers/courses.controller");

const {
    authenticateToken,
    authorizeRoles
} = require("../middlewares/auth.middleware");

router.get(
    "/",
    authenticateToken,
    authorizeRoles("admin", "teacher", "student"),
    courseController.getAllCourses
);

router.get(
    "/:id",
    authenticateToken,
    authorizeRoles("admin", "teacher", "student"),
    courseController.getCourseById
);

router.post(
    "/",
    authenticateToken,
    authorizeRoles("admin"),
    courseController.createCourse
);

router.put(
    "/:id",
    authenticateToken,
    authorizeRoles("admin"),
    courseController.updateCourse
);

router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("admin"),
    courseController.deleteCourse
);

router.post(
    "/:cursoId/student/:studentId",
    authenticateToken,
    authorizeRoles("admin"),
    courseController.enrollStudentInCourse
);

module.exports = router;