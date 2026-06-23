require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path')
const pool = require('./src/config/db');

//Middlewares
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.static(path.join(__dirname, 'frontend', 'AcadexFrontend', 'public')))

// settings
app.set('port', process.env.PORT);
// routes
app.get('/', (req, res)=>{
    res.sendFile(path.join(__dirname, '..', "frontend", "AcadexFrontend", 'public', "index.html"));
});
app.get('/api/saludo', (req, res)=>{
    res.json({
        mensaje: 'hola'
    })
});
app.listen(app.get('port'), ()=>{
console.log(`Aplicacion corriendo en el puerto ${app.get('port')}`)
})




//-----------------Routes------------------
//import routes
app.use("/api/auth", require("./routes/auth.routes"));

app.use("/api/users", require("./routes/users.routes"));

app.use("/api/cursos", require("./routes/cursos.routes"));

app.use("/api/tareas", require("./routes/tareas.routes"));

app.use("/api/entregas", require("./routes/entregas.routes"));

app.use("/api/eventos", require("./routes/eventos.routes"));

app.use(
    "/api/notificaciones",
    require("./routes/notificaciones.routes")
);


//------------------------------------------------------------------------