const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");
const {
  authenticateToken,
  authorizeRoles
} = require("../middlewares/auth.middleware");

router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin", "teacher", "student"),
  dashboardController.getDashboard
);

module.exports = router;
