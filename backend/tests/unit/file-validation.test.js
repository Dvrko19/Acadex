const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { getDeclaredType } = require("../../src/middlewares/submission-upload.middleware");
const { validateStoredFile } = require("../../src/services/file-validation.service");

test("rechaza doble extension y MIME incorrecto", () => {
  assert.throws(
    () => getDeclaredType({ originalname: "tarea.exe.pdf", mimetype: "application/pdf" }),
    { code: "INVALID_FILE_NAME" }
  );
  assert.throws(
    () => getDeclaredType({ originalname: "tarea.pdf", mimetype: "application/octet-stream" }),
    { code: "INVALID_FILE_MIME" }
  );
});

test("rechaza un ejecutable renombrado a PDF por sus magic bytes", async () => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "acadex-file-test-"));
  const filePath = path.join(directory, "test.pdf");
  await fs.promises.writeFile(filePath, Buffer.from("MZ executable content"));

  try {
    await assert.rejects(
      validateStoredFile({
        path: filePath,
        size: 21,
        acadexDeclaredType: {
          extension: "pdf",
          mimeType: "application/pdf"
        }
      }),
      { code: "INVALID_FILE_SIGNATURE" }
    );
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
});
