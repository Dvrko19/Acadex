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

router.put(
    "/:id/read",
    authenticateToken,
    authorizeRoles("admin", "teacher", "student"),
    notificationController.markAsRead
);

router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("admin"),
    notificationController.deleteNotification
);

module.exports = router;