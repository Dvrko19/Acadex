const fs = require("fs");
const path = require("path");

const normalizeStorageKey = (storageKey) => {
  const normalized = String(storageKey || "").replace(/\\/g, "/");
  if (!/^(quarantine|clean)\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(normalized)) {
    throw new Error("Invalid private storage key");
  }
  return normalized;
};

class PrivateStorageService {
  constructor(rootDirectory = process.env.PRIVATE_UPLOAD_DIRECTORY) {
    this.provider = "local";
    this.rootDirectory = path.resolve(
      rootDirectory || path.join(process.cwd(), "private-uploads")
    );
    this.quarantineDirectory = path.join(this.rootDirectory, "quarantine");
    this.cleanDirectory = path.join(this.rootDirectory, "clean");

    fs.mkdirSync(this.quarantineDirectory, { recursive: true });
    fs.mkdirSync(this.cleanDirectory, { recursive: true });
  }

  quarantineKey(storedFileName) {
    return normalizeStorageKey(path.posix.join("quarantine", storedFileName));
  }

  cleanKey(storedFileName) {
    return normalizeStorageKey(path.posix.join("clean", storedFileName));
  }

  resolveStorageKey(storageKey) {
    const normalized = normalizeStorageKey(storageKey);
    const absolutePath = path.resolve(this.rootDirectory, ...normalized.split("/"));
    const rootWithSeparator = `${this.rootDirectory}${path.sep}`;

    if (!absolutePath.startsWith(rootWithSeparator)) {
      throw new Error("Invalid private storage key");
    }

    return absolutePath;
  }

  async storeQuarantine(filePath, storedFileName) {
    const storageKey = this.quarantineKey(storedFileName);
    if (path.resolve(filePath) !== this.resolveStorageKey(storageKey)) {
      throw new Error("Invalid local quarantine path");
    }
    return storageKey;
  }

  async storeExisting(storageKey, filePath) {
    const targetPath = this.resolveStorageKey(storageKey);
    if (path.resolve(filePath) !== targetPath) {
      await fs.promises.copyFile(filePath, targetPath);
    }
    return normalizeStorageKey(storageKey);
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

  async discardTemporary() {}

  async exists(storageKey) {
    try {
      await fs.promises.access(this.resolveStorageKey(storageKey), fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  async createReadStream(storageKey) {
    return fs.createReadStream(this.resolveStorageKey(storageKey));
  }
}

class S3PrivateStorageService extends PrivateStorageService {
  constructor(options = {}) {
    super(options.rootDirectory);
    this.provider = "s3";
    this.bucket = options.bucket || process.env.S3_BUCKET || process.env.R2_BUCKET;
    const accountId = options.accountId || process.env.R2_ACCOUNT_ID;
    const accessKeyId =
      options.accessKeyId || process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey =
      options.secretAccessKey ||
      process.env.S3_SECRET_ACCESS_KEY ||
      process.env.R2_SECRET_ACCESS_KEY;
    const endpoint =
      options.endpoint ||
      process.env.S3_ENDPOINT ||
      process.env.R2_ENDPOINT ||
      (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
    const region =
      options.region || process.env.S3_REGION || (accountId ? "auto" : "");

    if (!this.bucket || !endpoint || !region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "S3 requiere S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID y S3_SECRET_ACCESS_KEY"
      );
    }

    const { S3Client } = require("@aws-sdk/client-s3");
    this.client = options.client || new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey }
    });
  }

  async upload(storageKey, filePath, mimeType) {
    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    const key = normalizeStorageKey(storageKey);
    const stat = await fs.promises.stat(filePath);
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fs.createReadStream(filePath),
      ContentLength: stat.size,
      ContentType: mimeType || "application/octet-stream"
    }));
    return key;
  }

  async storeQuarantine(filePath, storedFileName, mimeType) {
    return this.upload(this.quarantineKey(storedFileName), filePath, mimeType);
  }

  async storeExisting(storageKey, filePath, mimeType) {
    return this.upload(storageKey, filePath, mimeType);
  }

  async promote(storedFileName, { filePath, mimeType } = {}) {
    if (!filePath) throw new Error("S3 promotion requires the validated local file");
    const sourceKey = this.quarantineKey(storedFileName);
    const targetKey = this.cleanKey(storedFileName);
    await this.upload(targetKey, filePath, mimeType);
    try {
      await this.remove(sourceKey);
    } catch (error) {
      console.error("No se pudo limpiar el objeto de cuarentena en S3", {
        key: sourceKey,
        message: error.message
      });
    }
    return targetKey;
  }

  async remove(storageKey) {
    if (!storageKey) return;
    const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: normalizeStorageKey(storageKey)
    }));
  }

  async discardTemporary(filePath) {
    await super.removeAbsolute(filePath);
  }

  async exists(storageKey) {
    const { HeadObjectCommand } = require("@aws-sdk/client-s3");
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: normalizeStorageKey(storageKey)
      }));
      return true;
    } catch (error) {
      if (error?.name === "NotFound" || error?.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async createReadStream(storageKey) {
    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    const result = await this.client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: normalizeStorageKey(storageKey)
    }));
    if (!result.Body || typeof result.Body.pipe !== "function") {
      throw new Error("S3 did not return a readable object stream");
    }
    return result.Body;
  }
}

const createPrivateStorageService = (provider = process.env.FILE_STORAGE_PROVIDER || "local") => {
  const selectedProvider = String(provider).trim().toLowerCase();
  if (selectedProvider === "local") return new PrivateStorageService();
  if (["s3", "r2"].includes(selectedProvider)) return new S3PrivateStorageService();
  throw new Error(`Unsupported FILE_STORAGE_PROVIDER: ${provider}`);
};

module.exports = createPrivateStorageService();
module.exports.PrivateStorageService = PrivateStorageService;
module.exports.S3PrivateStorageService = S3PrivateStorageService;
module.exports.R2PrivateStorageService = S3PrivateStorageService;
module.exports.createPrivateStorageService = createPrivateStorageService;
module.exports.normalizeStorageKey = normalizeStorageKey;
