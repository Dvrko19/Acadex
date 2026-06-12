//Conexion a la base de datos
const mysql = require("mysql2");
 const connection = mysql.createConnection({
    host: "",
    database: "",
    user: "",
    password: "" 
    
 });

 connection.connect((error) =>{
    if(error){
        throw error;
    }else{
        console.log("Connection succesful")
    }
 })

 connection.end();