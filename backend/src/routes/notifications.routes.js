const express = require("express");
const router = express.Router();

const notificationController =
require("../controllers/notifications.controller");


router.get(
    "/",
    notificationController.getMyNotifications
);


router.put(
    "/:id/read",
    notificationController.markAsRead
);


router.delete(
    "/:id",
    notificationController.deleteNotification
);


module.exports = router;