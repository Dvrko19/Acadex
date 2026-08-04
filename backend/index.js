require("dotenv").config();

const express = require("express");
const cors = require("cors");
const apiRoutes = require("./src/routes");
const db = require("./src/config/db");
const { AppError } = require("./src/helpers/errors");
const errorHandler = require("./src/middlewares/error.middleware");

require("./src/listeners/user.listener");
require("./src/listeners/courses.listener");
require("./src/listeners/task.listener");
require("./src/listeners/submissions.listener");
require("./src/listeners/events.listener");

const app = express();
app.disable("x-powered-by");

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    }
  })
);
app.use(express.json({ limit: "1mb" }));

app.set("port", process.env.PORT || 4000);

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "API de Acadex funcionando"
  });
});

app.use("/api", apiRoutes);

app.use((req, res) => {
  throw new AppError("Ruta no encontrada", 404, "ROUTE_NOT_FOUND");
});

app.use(errorHandler);

const startServer = async () => {
  await db.verifyDatabaseConnection();
  return app.listen(app.get("port"), () => {
    console.log(`Aplicacion corriendo en el puerto ${app.get("port")}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("No se pudo iniciar Acadex API", error);
    process.exit(1);
  });
}

module.exports = { app, startServer };
