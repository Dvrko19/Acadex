const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");
const storageService = require("../services/private-storage.service");
const { AppError } = require("../helpers/errors");

const allowedDeclaredTypes = {
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
};

const maxFileSizeMb = Number(process.env.MAX_SUBMISSION_FILE_SIZE_MB || 25);
if (!Number.isFinite(maxFileSizeMb) || maxFileSizeMb <= 0) {
  throw new Error("MAX_SUBMISSION_FILE_SIZE_MB debe ser un numero positivo");
}

const getDeclaredType = (file) => {
  const originalName = file.originalname || "";
  const baseName = path.basename(originalName);
  const dotCount = (baseName.match(/\./g) || []).length;
  const extension = path.extname(baseName).slice(1).toLowerCase();

  if (
    !baseName ||
    baseName !== originalName ||
    baseName.length > 255 ||
    /[\x00-\x1f\x7f]/.test(baseName) ||
    originalName.includes("/") ||
    originalName.includes("\\") ||
    dotCount !== 1 ||
    !allowedDeclaredTypes[extension]
  ) {
    throw new AppError(
      "El nombre o la extension del archivo no estan permitidos.",
      400,
      "INVALID_FILE_NAME"
    );
  }

  if (file.mimetype !== allowedDeclaredTypes[extension]) {
    throw new AppError(
      "El tipo MIME no coincide con la extension del archivo.",
      400,
      "INVALID_FILE_MIME"
    );
  }

  return { extension, mimeType: allowedDeclaredTypes[extension] };
};

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, storageService.quarantineDirectory);
  },
  filename(req, file, callback) {
    try {
      const declaredType = getDeclaredType(file);
      file.acadexDeclaredType = declaredType;
      callback(null, `${randomUUID()}.${declaredType.extension}`);
    } catch (error) {
      callback(error);
    }
  }
});

const uploadSubmissionFile = multer({
  storage,
  limits: {
    fileSize: Math.floor(maxFileSizeMb * 1024 * 1024),
    files: 1,
    fields: 2,
    parts: 3,
    fieldSize: 1024
  },
  fileFilter(req, file, callback) {
    try {
      file.acadexDeclaredType = getDeclaredType(file);
      callback(null, true);
    } catch (error) {
      callback(error);
    }
  }
}).single("file");

module.exports = {
  uploadSubmissionFile,
  getDeclaredType,
  maxFileSizeMb
};
