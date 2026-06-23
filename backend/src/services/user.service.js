const db = require('../config/db');
const bcrypt = require('bcrypt');

//Para seleccionar todos los datos
const findAll = () =>{
    const [rows] = await db.query(
        "SELECT id, name, email, role FROM users"

    );
    return rows
}
//Funcion para encontrar el usuario mediante email.
const findByEmail = async ({email}) =>{
    const[rows] = await db.query(
        " SELECT * FROM users WHERE email = ?",
        [email]
    );

    return rows[0]
};
//Funcion para encontrar el usuario mediante ID
const findById = async (id) =>{
    const[rows] = await db.query(
        "SELECT *  FROM users WHERE id = ?",
        [id]
    );

    return rows[0];
}
//Funcion para crear un usuario
const createUser = async ({name, email, role, password}) =>{
    const passwordHash = await bcrypt.hash(password, 12);
    const[result] = await db.query(
        "INSERT INTO users (name, email, role, password) VALUES (?, ?, ?, ?)",
        [name, email, role, passwordHash]
    );

    return {
        id: result.insertId,
        name, 
        email,
        role
    };
};
//Funcion para eliminar el usuario mediante el ID
const deleteUser = async (id) =>{
    const [result] = await db.query(
        "DELETE FROM users WHERE id = ?",
        [id]
    );
    return result;
}
//Para actualizar los datos del usuario
const updateUser = async ({name, email, password}, id) =>{
    const [result] = await db.query(
    `
    UPDATE users
    Set name = ?, email = ?, password = ?
    where id = ?
        `,
        [name, email, password, id]
    )
    return result;
}



module.exports = {
    findAll,
    findByEmail,
    findById,
    createUser,
    deleteUser,
    updateUser
}