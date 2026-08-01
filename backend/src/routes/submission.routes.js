const express = require("express");
const router = express.Router();

const taskController = require("../controllers/tasks.controller");

const {
    authenticateToken,
    authorizeRoles
} = require("../middlewares/auth.middleware");

router.get(
    "/pending",
    authenticateToken,
    authorizeRoles("admin", "teacher", "student"),
    taskController.getPendingTasks
);

router.get(
    "/expired",
    authenticateToken,
    authorizeRoles("admin", "teacher"),
    taskController.getExpiredTasks
);

router.get(
    "/search",
    authenticateToken,
    authorizeRoles("admin", "teacher", "student"),
    taskController.searchTasksByTitle
);

router.get(
    "/count",
    authenticateToken,
    authorizeRoles("admin", "teacher"),
    taskController.countTasks
);

router.get(
    "/course/:courseId",
    authenticateToken,
    authorizeRoles("admin", "teacher", "student"),
    taskController.getTasksByCourse
);

router.get(
    "/",
    authenticateToken,
    authorizeRoles("admin", "teacher", "student"),
    taskController.getTasks
);

router.post(
    "/",
    authenticateToken,
    authorizeRoles("admin", "teacher"),
    taskController.createTask
);

router.get(
    "/:id",
    authenticateToken,
    authorizeRoles("admin", "teacher", "student"),
    taskController.getTaskById
);

router.put(
    "/:id",
    authenticateToken,
    authorizeRoles("admin", "teacher"),
    taskController.updateTask
);

router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("admin", "teacher"),
    taskController.deleteTask
);

module.exports = router;