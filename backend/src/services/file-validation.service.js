const fs = require("fs");
const crypto = require("crypto");
const yauzl = require("yauzl");
const { AppError } = require("../helpers/errors");

const invalidSignature = () => {
  throw new AppError(
    "El contenido del archivo no coincide con un formato permitido.",
    400,
    "INVALID_FILE_SIGNATURE"
  );
};

const calculateSha256 = (filePath) => new Promise((resolve, reject) => {
  const hash = crypto.createHash("sha256");
  const stream = fs.createReadStream(filePath);
  stream.on("data", (chunk) => hash.update(chunk));
  stream.on("error", reject);
  stream.on("end", () => resolve(hash.digest("hex")));
});

const inspectPptxArchive = (filePath, compressedSize) => new Promise((resolve, reject) => {
  yauzl.open(filePath, { lazyEntries: true, autoClose: true }, (openError, zipFile) => {
    if (openError) return reject(openError);

    let entries = 0;
    let totalUncompressedSize = 0;
    let hasContentTypes = false;
    let hasPresentation = false;
    let hasMacro = false;
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      zipFile.close();
      reject(error);
    };

    zipFile.on("error", fail);
    zipFile.on("entry", (entry) => {
      entries += 1;
      totalUncompressedSize += entry.uncompressedSize;
      const entryName = entry.fileName.replace(/\\/g, "/").toLowerCase();

      if (
        entries > 5000 ||
        totalUncompressedSize > 250 * 1024 * 1024 ||
        totalUncompressedSize > Math.max(compressedSize * 100, 10 * 1024 * 1024)
      ) {
        return fail(new Error("PPTX archive limits exceeded"));
      }

      if ((entry.generalPurposeBitFlag & 0x1) !== 0) {
        return fail(new Error("Encrypted PPTX entries are not accepted"));
      }

      if (entryName === "ppt/presentation.xml") hasPresentation = true;
      if (
        entryName.endsWith("vbaproject.bin") ||
        entryName.includes("/macros/") ||
        entryName.includes("macroenabled")
      ) {
        hasMacro = true;
      }

      if (entryName !== "[content_types].xml") {
        zipFile.readEntry();
        return;
      }

      zipFile.openReadStream(entry, (streamError, stream) => {
        if (streamError) return fail(streamError);
        const chunks = [];
        let size = 0;
        stream.on("data", (chunk) => {
          size += chunk.length;
          if (size > 1024 * 1024) {
            stream.destroy(new Error("PPTX content types file is too large"));
            return;
          }
          chunks.push(chunk);
        });
        stream.on("error", fail);
        stream.on("end", () => {
          const contentTypes = Buffer.concat(chunks).toString("utf8").toLowerCase();
          hasContentTypes = contentTypes.includes(
            "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"
          );
          if (contentTypes.includes("macroenabled") || contentTypes.includes("vbaproject")) {
            hasMacro = true;
          }
          zipFile.readEntry();
        });
      });
    });

    zipFile.on("end", () => {
      if (settled) return;
      settled = true;
      resolve({ hasContentTypes, hasPresentation, hasMacro });
    });

    zipFile.readEntry();
  });
});

const validateStoredFile = async (file) => {
  if (!file?.path || !file.acadexDeclaredType) {
    throw new AppError(
      "Debes adjuntar un archivo en el campo file.",
      400,
      "FILE_REQUIRED"
    );
  }

  const handle = await fs.promises.open(file.path, "r");
  const signature = Buffer.alloc(8);
  try {
    await handle.read(signature, 0, signature.length, 0);
  } finally {
    await handle.close();
  }

  const { extension, mimeType } = file.acadexDeclaredType;
  if (extension === "pdf") {
    if (signature.subarray(0, 5).toString("ascii") !== "%PDF-") {
      invalidSignature();
    }
  } else if (
    signature[0] !== 0x50 ||
    signature[1] !== 0x4b ||
    signature[2] !== 0x03 ||
    signature[3] !== 0x04
  ) {
    invalidSignature();
  } else {
    let archive;
    try {
      archive = await inspectPptxArchive(file.path, file.size);
    } catch {
      invalidSignature();
    }

    if (!archive.hasContentTypes || !archive.hasPresentation || archive.hasMacro) {
      invalidSignature();
    }
  }

  return {
    extension,
    mimeType,
    fileHash: await calculateSha256(file.path)
  };
};

module.exports = {
  validateStoredFile,
  calculateSha256,
  inspectPptxArchive
};
