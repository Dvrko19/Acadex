require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path')
const pool = require('./src/config/db');

const authRoutes = require("./src/routes/auth.routes");
const userRoutes = require("./src/routes/users.routes");
const courseRoutes = require("./src/routes/courses.routes");
const taskRoutes =  require("./src/routes/task.routes");
const submissionRoutes = require("./src/routes/submission.routes");
const eventRoutes = require("./src/routes/events.routes");
const notificationRoutes = require("./src/routes/notifications.routes")

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
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);


//------------------------------------------------------------------------