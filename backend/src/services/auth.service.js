const user = require("../services/user.service");
const bcrypt = require("bcrypt");

//Funcion para loguear al usuario
const login = async ({ email, password }) => {

  const userExist = await user.findByEmail(email);

  if (!userExist) {
    throw new Error("Usuario o Contraseña incorrecto");
  }

  const isPasswordValid = await bcrypt.compare(password, userExist.password); //Esto compara la contraseña ingresada con la que esta en la base de dato.

  if (!isPasswordValid) {
    throw new Error("Usuario o Contraseña incorrecto");
  }

  return {
    token,
    user: {
      id: userExist.id,
      name: userExist.name,
      email: userExist.email,
      role: userExist.role
    }
  };

};

module.exports = {
  login,
};
