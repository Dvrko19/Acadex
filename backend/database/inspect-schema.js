require("dotenv").config();

const mysql = require("mysql2/promise");

const inspect = async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  const schema = process.env.DB_NAME;
  const queries = {
    server: [
      `SELECT
         VERSION() AS version,
         DATABASE() AS database_name,
         @@session.time_zone AS session_time_zone,
         @@system_time_zone AS system_time_zone`
    ],
    tables: [
      `SELECT TABLE_NAME, ENGINE, TABLE_COLLATION, TABLE_ROWS
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME`,
      [schema]
    ],
    columns: [
      `SELECT
         TABLE_NAME, ORDINAL_POSITION, COLUMN_NAME, COLUMN_TYPE,
         IS_NULLABLE, COLUMN_DEFAULT, EXTRA, COLUMN_KEY, COLLATION_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      [schema]
    ],
    indexes: [
      `SELECT
         TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME, SUB_PART
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
      [schema]
    ],
    foreign_keys: [
      `SELECT
         k.TABLE_NAME, k.CONSTRAINT_NAME, k.COLUMN_NAME,
         k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME,
         r.UPDATE_RULE, r.DELETE_RULE
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
       INNER JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS r
         ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
        AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
       WHERE k.CONSTRAINT_SCHEMA = ?
         AND k.REFERENCED_TABLE_NAME IS NOT NULL
       ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION`,
      [schema]
    ],
    checks: [
      `SELECT tc.TABLE_NAME, tc.CONSTRAINT_NAME, cc.CHECK_CLAUSE
       FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
       INNER JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
         ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
        AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
       WHERE tc.CONSTRAINT_SCHEMA = ?
         AND tc.CONSTRAINT_TYPE = 'CHECK'
       ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_NAME`,
      [schema]
    ],
    triggers: [
      `SELECT
         EVENT_OBJECT_TABLE AS TABLE_NAME, TRIGGER_NAME,
         ACTION_TIMING, EVENT_MANIPULATION, ACTION_STATEMENT
       FROM INFORMATION_SCHEMA.TRIGGERS
       WHERE TRIGGER_SCHEMA = ?
       ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME`,
      [schema]
    ]
  };

  for (const [name, args] of Object.entries(queries)) {
    const [rows] = await db.query(...args);
    console.log(`\n### ${name}`);
    console.log(JSON.stringify(rows, null, 2));
  }

  await db.end();
};

inspect().catch((error) => {
  console.error(error.code || error.name, error.message);
  process.exit(1);
});
