class AppError extends Error {
  constructor(message, statusCode = 500, code = "REQUEST_FAILED") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

const asyncHandler = (handler) => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  asyncHandler
};
