const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  MockFileScanService,
  createFileScanService
} = require("../../src/services/file-scan.service");

const withTemporaryFile = async (callback) => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "acadex-scan-test-"));
  const filePath = path.join(directory, "file.pdf");
  await fs.promises.writeFile(filePath, "%PDF-1.7\nmock content");
  try {
    return await callback(filePath);
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
};

test("mock scanner approves a readable file by default", async () => {
  await withTemporaryFile(async (filePath) => {
    const result = await new MockFileScanService({ delayMs: 0 }).scanFile(filePath);
    assert.equal(result.status, "clean");
  });
});

test("mock scanner can simulate rejection and service failure", async () => {
  await withTemporaryFile(async (filePath) => {
    const rejected = await new MockFileScanService({ result: "infected", delayMs: 0 })
      .scanFile(filePath);
    assert.equal(rejected.status, "infected");

    await assert.rejects(
      new MockFileScanService({ result: "failed", delayMs: 0 }).scanFile(filePath),
      /Simulated file validation unavailable/
    );
  });
});

test("factory selects the mock provider outside the test environment", () => {
  const previousProvider = process.env.FILE_SCAN_PROVIDER;
  process.env.FILE_SCAN_PROVIDER = "mock";
  try {
    assert.ok(createFileScanService() instanceof MockFileScanService);
  } finally {
    if (previousProvider === undefined) delete process.env.FILE_SCAN_PROVIDER;
    else process.env.FILE_SCAN_PROVIDER = previousProvider;
  }
});
