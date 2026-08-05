const userService = require("../services/user.service");
const { asyncHandler } = require("../helpers/errors");
const { requireFields, toInt } = require("../helpers/validators");

const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.findAll();
  res.status(200).json({ success: true, data: users });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.findSafeById(toInt(req.params.id));

  if (!user || user.deletedAt) {
    return res.status(404).json({
      success: false,
      message: "Usuario no encontrado"
    });
  }

  res.status(200).json({ success: true, data: user });
});

const searchUsers = asyncHandler(async (req, res) => {
  const result = await userService.searchUsers(req.query, req.user);
  res.status(200).json({ success: true, ...result });
});

const createUser = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "email", "role", "password"]);

  const result = await userService.createUser(req.body);

  res.status(201).json({
    success: true,
    message: "Usuario creado correctamente",
    data: result
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const result = await userService.updateUser(toInt(req.params.id), req.body);

  res.status(200).json({
    success: true,
    message: "Usuario actualizado correctamente",
    data: result
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(toInt(req.params.id));
  res.status(204).send();
});

module.exports = {
  getUsers,
  searchUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
