const express = require("express");
const router = express.Router();

const taskController =
require("../controllers/task.controller");


router.get("/pending", taskController.getPendingTasks);

router.get("/expired", taskController.getExpiredTasks);

router.get("/search", taskController.searchTasksByTitle);

router.get("/count", taskController.countTasks);


router.get("/", taskController.getTasks);


router.post("/", taskController.createTask);


router.get(
    "/course/:courseId",
    taskController.getTasksByCourse
);


router.get("/:id", taskController.getTaskById);


router.put("/:id", taskController.updateTask);


router.delete("/:id", taskController.deleteTask);



module.exports = router;