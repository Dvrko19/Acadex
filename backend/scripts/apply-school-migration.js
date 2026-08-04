require("dotenv").config();

const fs = require("fs");
const path = require("path");
const db = require("../src/config/db");

const migrationPath = path.join(
  __dirname,
  "..",
  "database",
  "migrations",
  "20260801_001_school_profiles_and_submission_files.up.sql"
);

const splitStatements = (source) => {
  const statements = [];
  let delimiter = ";";
  let buffer = "";

  for (const line of source.split(/\r?\n/)) {
    const delimiterMatch = /^\s*DELIMITER\s+(\S+)\s*$/i.exec(line);
    if (delimiterMatch) {
      delimiter = delimiterMatch[1];
      continue;
    }

    buffer += `${line}\n`;
    if (buffer.trimEnd().endsWith(delimiter)) {
      const statement = buffer.trimEnd().slice(0, -delimiter.length).trim();
      if (statement) statements.push(statement);
      buffer = "";
    }
  }

  if (buffer.trim()) statements.push(buffer.trim());
  return statements;
};

const tableExists = async (name) => {
  const [rows] = await db.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [name]
  );
  return rows.length > 0;
};

const columnExists = async (table, column) => {
  const [rows] = await db.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
};

const run = async () => {
  const hasStudentProfiles = await tableExists("student_profiles");
  const hasTeacherProfiles = await tableExists("teacher_profiles");
  const hasSubmissionMetadata = await columnExists("submissions", "storage_key");

  if (hasStudentProfiles && hasTeacherProfiles && hasSubmissionMetadata) {
    console.log("school migration already applied");
    return;
  }
  if (hasStudentProfiles || hasTeacherProfiles || hasSubmissionMetadata) {
    throw new Error("Migracion escolar aplicada parcialmente; revision manual requerida");
  }

  const source = fs.readFileSync(migrationPath, "utf8");
  const statements = splitStatements(source);
  for (let index = 0; index < statements.length; index += 1) {
    await db.query(statements[index]);
    console.log(`applied ${index + 1}/${statements.length}`);
  }
  console.log("school migration completed");
};

run()
  .catch((error) => {
    console.error("school migration failed", error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
