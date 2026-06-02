const express = require('express');
const app = express();
const path = require('path')

//Middlewares
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.static(path.join(__dirname, 'frontend', 'AcadexFrontend', 'public')))

// settings
app.set('port', 4000);
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


