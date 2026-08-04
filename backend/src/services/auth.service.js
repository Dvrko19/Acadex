const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userService = require("./user.service");
const { AppError } = require("../helpers/errors");

const login = async ({ email, password }) => {
  const user = await userService.findByEmail(email);

  if (!user || user.deletedAt || user.status === "inactive") {
    throw new AppError("Usuario o contrasena incorrectos", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Usuario o contrasena incorrectos", 401);
  }

  const authUser = await userService.findSafeById(user.id);
  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return {
    token,
    user: authUser
  };
};

module.exports = {
  login
};
