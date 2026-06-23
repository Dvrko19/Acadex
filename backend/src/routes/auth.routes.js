const express = require('express');
const router = express.Router();

module.exports = router;

// login users
router.post(
    "/login",
    authController.login
);


module.exports = router;