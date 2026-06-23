const authService = require('../services/auth.service')

const login = async(req, res, next) => {

    try {
        const {email, password} = req.body;

        const result = await authService.login(email, password);

        return res.status(200).json({
            success: true,
            message: "Inicio de sesión exitoso",
            data: result
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    login
}