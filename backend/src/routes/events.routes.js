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
    authorizeRoles("admin"),
    eventController.getEvents
);

router.get(
    "/user/:userId",
    authenticateToken,
    authorizeRoles("admin"),
    eventController.getEventsByUser
);

router.get(
    "/:id",
    authenticateToken,
    authorizeRoles("admin"),
    eventController.getEventById
);

module.exports = router;