// Imports
require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const apiRoutes = require('./src/routes');

// Middlewares global
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173"
    })
);
app.use(express.json());


// Settings
app.set('port', process.env.PORT || 4000);

// Ruta general de prueba
app.get("/health", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "API de Acadex funcionando"
    });
});


//-----------------Routes------------------
app.use("/api", apiRoutes);


// Iniciando el servidor

app.listen(app.get('port'), ()=>{
console.log(`Aplicacion corriendo en el puerto ${app.get('port')}`)
});
