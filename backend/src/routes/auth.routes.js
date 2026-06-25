const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

module.exports = router;

// login users
router.post(
    "/login",
    authController.login
);


module.exports = router;