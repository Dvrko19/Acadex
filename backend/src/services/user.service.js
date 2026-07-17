const db = require('../config/db');
const bcrypt = require('bcrypt');
const eventBus = require('../events/eventBus');

//Para seleccionar todos los datos
const findAll = async () =>{
    const [rows] = await db.query(
        "SELECT id, name, email, role FROM users"

    );//El error era que esta no estaba como una funcion asincrona, pero usaba un await. El error solucionado
    return rows
}
//Funcion para encontrar el usuario mediante email.
const findByEmail = async (email) =>{
    const[rows] = await db.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
    );

    return rows[0];
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

    const user = {
        id: result.insertId,
        name, 
        email,
        role
    };

    eventBus.emit("user.created", user);

    return user
};
//Funcion para eliminar el usuario mediante el ID
const deleteUser = async (id) =>{
    const [result] = await db.query(
        "DELETE FROM users WHERE id = ?",
        [id]
    );
    if(result.affectedRows == 0){
        throw new Error("Usuario no encontrado")
    }
    const deletedUser = {
        id
    }
    eventBus.emit("user.deleted", deleteUser)
    return deleteUser;
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

    const updated = {
        id,
        name,
        email
    }
    eventBus.emit("user.updated", updated);
    return updated;
}



module.exports = {
    findAll,
    findByEmail,
    findById,
    createUser,
    deleteUser,
    updateUser
}