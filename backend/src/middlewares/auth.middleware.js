const jwt = require("jsonwebtoken");
const { AppError } = require("../helpers/errors");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AppError("Token no proporcionado", 401));
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Formato de token invalido", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    req.user = {
      ...decoded,
      id: userId,
      userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    next(new AppError("Token invalido o expirado", 401));
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Usuario no autenticado", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("No tienes permisos para esta accion", 403));
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
