const fs = require("fs");
const path = require("path");

class PrivateStorageService {
  constructor(rootDirectory = process.env.PRIVATE_UPLOAD_DIRECTORY) {
    this.rootDirectory = path.resolve(
      rootDirectory || path.join(process.cwd(), "private-uploads")
    );
    this.quarantineDirectory = path.join(this.rootDirectory, "quarantine");
    this.cleanDirectory = path.join(this.rootDirectory, "clean");

    fs.mkdirSync(this.quarantineDirectory, { recursive: true });
    fs.mkdirSync(this.cleanDirectory, { recursive: true });
  }

  quarantineKey(storedFileName) {
    return path.posix.join("quarantine", storedFileName);
  }

  cleanKey(storedFileName) {
    return path.posix.join("clean", storedFileName);
  }

  resolveStorageKey(storageKey) {
    const absolutePath = path.resolve(
      this.rootDirectory,
      ...String(storageKey || "").split("/")
    );
    const rootWithSeparator = `${this.rootDirectory}${path.sep}`;

    if (!absolutePath.startsWith(rootWithSeparator)) {
      throw new Error("Invalid private storage key");
    }

    return absolutePath;
  }

  async promote(storedFileName) {
    const sourceKey = this.quarantineKey(storedFileName);
    const targetKey = this.cleanKey(storedFileName);
    await fs.promises.rename(
      this.resolveStorageKey(sourceKey),
      this.resolveStorageKey(targetKey)
    );
    return targetKey;
  }

  async remove(storageKey) {
    if (!storageKey) return;
    try {
      await fs.promises.unlink(this.resolveStorageKey(storageKey));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  async removeAbsolute(filePath) {
    if (!filePath) return;
    const resolved = path.resolve(filePath);
    const quarantineRoot = `${this.quarantineDirectory}${path.sep}`;
    if (!resolved.startsWith(quarantineRoot)) {
      throw new Error("Refusing to remove a file outside quarantine");
    }

    try {
      await fs.promises.unlink(resolved);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  async exists(storageKey) {
    try {
      await fs.promises.access(this.resolveStorageKey(storageKey), fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  createReadStream(storageKey) {
    return fs.createReadStream(this.resolveStorageKey(storageKey));
  }
}

module.exports = new PrivateStorageService();
module.exports.PrivateStorageService = PrivateStorageService;
