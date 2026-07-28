const express = require("express");
const router = express.Router();

const userController =
require("../controllers/user.controller");

const {
    authenticateToken,
    authorizeRoles
} = require("../middlewares/auth.middleware");


router.get(
    "/",
    authenticateToken,
    authorizeRoles("admin"),
    userController.findAll
);


router.get(
    "/:id",
    userController.findById
);


// CRUD

router.post(
    "/",
    userController.createUser
);


router.put(
    "/:id",
    userController.updateUser
);


router.delete(
    "/:id",
    userController.deleteUser
);


module.exports = router;