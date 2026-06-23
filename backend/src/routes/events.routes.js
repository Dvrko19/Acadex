const express = require("express");
const router = express.Router();

const eventController = require("../controllers/events.controller");


router.get("/", eventController.getEvents);

router.get("/:id", eventController.getEventById);


router.get(
    "/user/:userId",
    eventController.getEventsByUser
);


module.exports = router;