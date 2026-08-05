const express = require("express");
const { rateLimit } = require("express-rate-limit");
const router = express.Router();
const authController = require("../controllers/auth.controller");

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_RATE_LIMIT || 10),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler(req, res) {
    return res.status(429).json({
      success: false,
      message: "Demasiados intentos de acceso. Intenta nuevamente en 15 minutos.",
      code: "LOGIN_RATE_LIMIT_EXCEEDED"
    });
  }
});

router.post("/login", loginRateLimit, authController.login);

module.exports = router;
