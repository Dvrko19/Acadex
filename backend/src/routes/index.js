const express = require("express");

const authRoutes = require("./auth.routes");
const userRoutes = require("./users.routes");
const courseRoutes = require("./courses.routes");
const taskRoutes = require("./task.routes");
const submissionRoutes = require("./submission.routes");
const eventRoutes = require("./events.routes");
const notificationRoutes = require("./notifications.routes");
const dashboardRoutes = require("./dashboard.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/users", userRoutes);
router.use("/courses", courseRoutes);
router.use("/tasks", taskRoutes);
router.use("/submissions", submissionRoutes);
router.use("/events", eventRoutes);
router.use("/notifications", notificationRoutes);

module.exports = router;
