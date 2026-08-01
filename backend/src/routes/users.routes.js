const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

// router.get(
//   "/",
//   authenticateToken,
//   authorizeRoles("admin"),
//   userController.findAll,
// );

// router.get(
//   "/:id",
//   authenticateToken,
//   authorizeRoles("admin"),
//   userController.findById,
// );

// CRUD

router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  userController.createUser
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  userController.updateUser,
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  userController.deleteUser,
);

module.exports = router;
