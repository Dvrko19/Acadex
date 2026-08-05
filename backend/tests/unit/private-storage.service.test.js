const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { Readable } = require("stream");

const {
  PrivateStorageService,
  R2PrivateStorageService,
  normalizeStorageKey
} = require("../../src/services/private-storage.service");

const readStream = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
};

test("local private storage promotes and reads a quarantined file", async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "acadex-local-storage-"));
  const storage = new PrivateStorageService(root);
  const fileName = "11111111-1111-4111-8111-111111111111.pdf";
  const filePath = path.join(storage.quarantineDirectory, fileName);

  try {
    await fs.promises.writeFile(filePath, "private-content");
    assert.equal(await storage.storeQuarantine(filePath, fileName), `quarantine/${fileName}`);
    const cleanKey = await storage.promote(fileName);
    assert.equal(cleanKey, `clean/${fileName}`);
    assert.equal(await storage.exists(cleanKey), true);
    assert.equal((await readStream(await storage.createReadStream(cleanKey))).toString(), "private-content");
    await storage.remove(cleanKey);
    assert.equal(await storage.exists(cleanKey), false);
  } finally {
    await fs.promises.rm(root, { recursive: true, force: true });
  }
});

test("R2 private storage keeps objects private behind its adapter", async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "acadex-r2-storage-"));
  const objects = new Map();
  const client = {
    async send(command) {
      const { Key, Body } = command.input;
      if (command.constructor.name === "PutObjectCommand") {
        objects.set(Key, await readStream(Body));
        return {};
      }
      if (command.constructor.name === "DeleteObjectCommand") {
        objects.delete(Key);
        return {};
      }
      if (command.constructor.name === "HeadObjectCommand") {
        if (!objects.has(Key)) {
          const error = new Error("Not found");
          error.$metadata = { httpStatusCode: 404 };
          throw error;
        }
        return {};
      }
      if (command.constructor.name === "GetObjectCommand") {
        return { Body: Readable.from(objects.get(Key)) };
      }
      throw new Error(`Unexpected command: ${command.constructor.name}`);
    }
  };
  const storage = new R2PrivateStorageService({
    rootDirectory: root,
    bucket: "acadex-test",
    endpoint: "https://r2.test.invalid",
    accessKeyId: "test-access-key",
    secretAccessKey: "test-secret-key",
    client
  });
  const fileName = "22222222-2222-4222-8222-222222222222.pdf";
  const filePath = path.join(storage.quarantineDirectory, fileName);

  try {
    await fs.promises.writeFile(filePath, "r2-private-content");
    await storage.storeQuarantine(filePath, fileName, "application/pdf");
    const cleanKey = await storage.promote(fileName, {
      filePath,
      mimeType: "application/pdf"
    });
    await storage.discardTemporary(filePath);

    assert.equal(objects.has(`quarantine/${fileName}`), false);
    assert.equal(await storage.exists(cleanKey), true);
    assert.equal((await readStream(await storage.createReadStream(cleanKey))).toString(), "r2-private-content");
    assert.equal(fs.existsSync(filePath), false);
  } finally {
    await fs.promises.rm(root, { recursive: true, force: true });
  }
});

test("private storage rejects traversal keys", () => {
  assert.throws(() => normalizeStorageKey("../database.env"), /Invalid private storage key/);
  assert.throws(() => normalizeStorageKey("clean/nested/file.pdf"), /Invalid private storage key/);
});
