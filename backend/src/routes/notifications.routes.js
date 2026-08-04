const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notifications.controller");
const {
  authenticateToken,
  authorizeRoles
} = require("../middlewares/auth.middleware");

router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin", "teacher", "student"),
  notificationController.getMyNotifications
);

router.get(
  "/unread-count",
  authenticateToken,
  authorizeRoles("admin", "teacher", "student"),
  notificationController.countUnread
);

router.patch(
  "/read-all",
  authenticateToken,
  authorizeRoles("admin", "teacher", "student"),
  notificationController.markAllAsRead
);

router.patch(
  "/:id/read",
  authenticateToken,
  authorizeRoles("admin", "teacher", "student"),
  notificationController.markAsRead
);

// Temporary compatibility aliases for clients that still use PUT.
router.put(
  "/read-all",
  authenticateToken,
  authorizeRoles("admin", "teacher", "student"),
  notificationController.markAllAsRead
);

router.put(
  "/:id/read",
  authenticateToken,
  authorizeRoles("admin", "teacher", "student"),
  notificationController.markAsRead
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin", "teacher", "student"),
  notificationController.deleteNotification
);

module.exports = router;
