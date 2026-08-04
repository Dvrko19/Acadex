const mysql = require("mysql2/promise");

const appTimezone = process.env.APP_TIMEZONE || "UTC";
if (!["UTC", "Z", "+00:00"].includes(appTimezone)) {
  throw new Error("APP_TIMEZONE debe configurarse como UTC");
}

const parseDatabaseUrl = (value) => {
  const url = new URL(value);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, ""))
  };
};

const connectionOptions = process.env.DATABASE_URL
  ? parseDatabaseUrl(process.env.DATABASE_URL)
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    };

const pool = mysql.createPool({
  ...connectionOptions,
  timezone: "Z",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
});

pool.on("connection", (connection) => {
  connection.query("SET SESSION time_zone = '+00:00'", (error) => {
    if (error) console.error("No se pudo configurar UTC en MySQL", error.message);
  });
});

const verifyDatabaseConnection = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query("SET SESSION time_zone = '+00:00'");
    await connection.ping();
  } finally {
    connection.release();
  }
};

module.exports = pool;
module.exports.verifyDatabaseConnection = verifyDatabaseConnection;
