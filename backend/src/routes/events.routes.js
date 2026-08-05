const express = require("express");
const router = express.Router();

const eventController = require("../controllers/events.controller");
const {
  authenticateToken,
  authorizeRoles
} = require("../middlewares/auth.middleware");

router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin", "teacher", "student"),
  eventController.getEvents
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin", "teacher"),
  eventController.createEvent
);

router.get(
  "/user/:userId",
  authenticateToken,
  authorizeRoles("admin", "teacher", "student"),
  eventController.getEventsByUser
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("admin", "teacher", "student"),
  eventController.getEventById
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin", "teacher"),
  eventController.deleteEvent
);

module.exports = router;
