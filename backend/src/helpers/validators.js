const { AppError } = require("./errors");

const toInt = (value, field = "id") => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${field} invalido`, 400);
  }

  return parsed;
};

const requireFields = (payload, fields) => {
  const missing = fields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || value === "";
  });

  if (missing.length > 0) {
    throw new AppError(`Campos obligatorios: ${missing.join(", ")}`, 400);
  }
};

const sanitizeUser = (user) => {
  if (!user) return user;
  const { password, password_hash, ...safeUser } = user;
  return safeUser;
};

const parseOptionalNumber = (value, field) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new AppError(`${field} debe ser numerico`, 400);
  }

  return parsed;
};

module.exports = {
  toInt,
  requireFields,
  sanitizeUser,
  parseOptionalNumber
};
