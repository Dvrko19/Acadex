const multer = require("multer");
const { AppError } = require("../helpers/errors");

const logTechnicalError = (error, req) => {
  console.error("Request failed", {
    method: req.method,
    path: req.originalUrl,
    code: error.code,
    errno: error.errno,
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack
  });
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  logTechnicalError(error, req);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "El archivo supera el tamano permitido.",
        code: "FILE_TOO_LARGE"
      });
    }

    return res.status(400).json({
      success: false,
      message: "No se pudo procesar el archivo enviado.",
      code: "INVALID_MULTIPART_REQUEST"
    });
  }

  if (error instanceof AppError || error.isOperational) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
      code: error.code || "REQUEST_FAILED"
    });
  }

  return res.status(500).json({
    success: false,
    message: "No se pudo completar la solicitud.",
    code: "INTERNAL_SERVER_ERROR"
  });
};

module.exports = errorHandler;
