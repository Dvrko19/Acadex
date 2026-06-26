//Conexion a la base de datos
const mysql = require("mysql2/promise");
 const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
 });


//Verificar la connection funciona
pool.getConnection((error, connection) => {
    if(error){
        console.error('Error conectado a MySql', error.message);
        return;
    }

    console.log('Conection exitosa')
    connection.release();
});


 module.exports = pool;