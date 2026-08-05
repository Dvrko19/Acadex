require("dotenv").config();

const fs = require("fs");
const path = require("path");
const storageService = require("../src/services/private-storage.service");

const sourceDirectory = path.resolve(
  process.env.MIGRATION_SOURCE_DIRECTORY ||
    process.env.PRIVATE_UPLOAD_DIRECTORY ||
    path.join(process.cwd(), "private-uploads")
);

const mimeTypes = {
  ".pdf": "application/pdf",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
};

const migrate = async () => {
  if (storageService.provider !== "r2") {
    throw new Error("Configura FILE_STORAGE_PROVIDER=r2 antes de ejecutar la migracion");
  }

  let uploaded = 0;
  let skipped = 0;

  for (const namespace of ["quarantine", "clean"]) {
    const directory = path.join(sourceDirectory, namespace);
    if (!fs.existsSync(directory)) continue;

    const entries = await fs.promises.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const extension = path.extname(entry.name).toLowerCase();
      if (!mimeTypes[extension]) {
        skipped += 1;
        continue;
      }

      const storageKey = `${namespace}/${entry.name}`;
      if (await storageService.exists(storageKey)) {
        skipped += 1;
        continue;
      }

      await storageService.storeExisting(
        storageKey,
        path.join(directory, entry.name),
        mimeTypes[extension]
      );
      uploaded += 1;
    }
  }

  console.log(`Migracion terminada: ${uploaded} archivos cargados, ${skipped} omitidos.`);
};

migrate().catch((error) => {
  console.error("No se pudieron migrar los archivos privados:", error.message);
  process.exitCode = 1;
});
