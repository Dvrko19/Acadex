const authService = require("../services/auth.service");
const { asyncHandler } = require("../helpers/errors");
const { requireFields } = require("../helpers/validators");

const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password"]);

  const result = await authService.login(req.body);

  return res.status(200).json({
    success: true,
    message: "Inicio de sesion exitoso",
    data: result
  });
});

module.exports = {
  login
};
