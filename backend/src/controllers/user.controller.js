const userService = require('../services/user.service');

const createUser = async(req, res, next) => {

    try {
        const result = await userService.createUser(req.body);

        res.status(201).json({
            success: true,
            message: "Usuario creado correctamente",
            data: result
        })
    } catch (error) {
        next(error);
    }
}

const updateUser = async(req, res, next) => {

    try {
        const {id} = req.params;
        const result = await userService.updateUser(id, req.body);

        res.status(200).json({
            success: true,
            message: "Usuario actualizado correctamente",
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const deleteUser = async(req, res, next) => {

    try {
        const {id} = req.params;
        const result = await userService.deleteUser(id);

        res.status(200).json({
            success: true,
            message: "Usuario eliminado correctamente",
            data: result
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createUser,
    updateUser,
    deleteUser
}