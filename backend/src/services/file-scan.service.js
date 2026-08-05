const fs = require("fs");
const net = require("net");

class FileScanService {
  async scanFile() {
    throw new Error("FileScanService.scanFile must be implemented");
  }
}

class ClamAvFileScanService extends FileScanService {
  constructor({
    host = process.env.CLAMAV_HOST,
    port = Number(process.env.CLAMAV_PORT || 3310),
    timeoutMs = Number(process.env.CLAMAV_TIMEOUT_MS || 30000)
  } = {}) {
    super();
    this.host = host;
    this.port = port;
    this.timeoutMs = timeoutMs;
  }

  async scanFile(filePath) {
    if (!this.host) {
      throw new Error("CLAMAV_HOST is not configured");
    }

    const response = await new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: this.host, port: this.port });
      const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });
      const chunks = [];
      let settled = false;

      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        stream.destroy();
        socket.destroy();
        if (error) reject(error);
        else resolve(value);
      };

      socket.setTimeout(this.timeoutMs);
      socket.on("timeout", () => finish(new Error("ClamAV scan timed out")));
      socket.on("error", (error) => finish(error));
      socket.on("data", (chunk) => {
        chunks.push(chunk);
        const responseBuffer = Buffer.concat(chunks);
        const terminator = responseBuffer.indexOf(0);
        if (terminator !== -1) {
          finish(null, responseBuffer.subarray(0, terminator).toString("utf8"));
        }
      });
      socket.on("end", () => finish(null, Buffer.concat(chunks).toString("utf8")));

      socket.on("connect", () => {
        socket.write("zINSTREAM\0");
        stream.on("error", (error) => finish(error));
        stream.on("data", (chunk) => {
          const length = Buffer.alloc(4);
          length.writeUInt32BE(chunk.length, 0);
          if (!socket.write(Buffer.concat([length, chunk]))) {
            stream.pause();
            socket.once("drain", () => stream.resume());
          }
        });
        stream.on("end", () => {
          socket.end(Buffer.alloc(4));
        });
      });
    });

    if (/\bFOUND\b/.test(response)) {
      return { status: "infected", result: "Malware detectado por el antivirus" };
    }
    if (/\bOK\b/.test(response)) {
      return { status: "clean", result: null };
    }

    throw new Error(`Unexpected ClamAV response: ${response.trim()}`);
  }
}

class MockFileScanService extends FileScanService {
  constructor({
    result = process.env.MOCK_FILE_SCAN_RESULT || "clean",
    delayMs = Number(process.env.MOCK_FILE_SCAN_DELAY_MS || 400)
  } = {}) {
    super();
    this.result = String(result).trim().toLowerCase();
    this.delayMs = Number(delayMs);

    if (!["clean", "infected", "failed"].includes(this.result)) {
      throw new Error("MOCK_FILE_SCAN_RESULT must be clean, infected or failed");
    }
    if (!Number.isFinite(this.delayMs) || this.delayMs < 0) {
      throw new Error("MOCK_FILE_SCAN_DELAY_MS must be a positive number");
    }
  }

  async scanFile(filePath) {
    await fs.promises.access(filePath, fs.constants.R_OK);
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.result === "failed") {
      throw new Error("Simulated file validation unavailable");
    }
    if (this.result === "infected") {
      return { status: "infected", result: "Archivo rechazado por la simulacion" };
    }
    return { status: "clean", result: "Validacion simulada completada" };
  }
}

class TestFileScanService extends FileScanService {
  async scanFile(filePath) {
    const content = await fs.promises.readFile(filePath);
    if (content.includes(Buffer.from("EICAR-TEST-FILE"))) {
      return { status: "infected", result: "Test malware detected" };
    }
    if (content.includes(Buffer.from("SCAN-FAIL"))) {
      throw new Error("Test scanner unavailable");
    }
    return { status: "clean", result: null };
  }
}

const createFileScanService = () => {
  const provider = String(process.env.FILE_SCAN_PROVIDER || "clamav")
    .trim()
    .toLowerCase();

  if (provider === "mock") {
    console.warn("File validation is running in mock mode; no antivirus scan is performed");
    return new MockFileScanService();
  }
  if (provider === "test") {
    if (process.env.NODE_ENV !== "test") {
      throw new Error("The test file scanner is forbidden outside NODE_ENV=test");
    }
    return new TestFileScanService();
  }
  if (provider === "clamav") return new ClamAvFileScanService();

  throw new Error(`Unsupported FILE_SCAN_PROVIDER: ${provider}`);
};

module.exports = {
  FileScanService,
  ClamAvFileScanService,
  MockFileScanService,
  TestFileScanService,
  createFileScanService
};
