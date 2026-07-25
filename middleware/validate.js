function validateRegister(req, res, next) {

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required."
        });
    }

    if (username.length < 3) {
        return res.status(400).json({
            success: false,
            message: "Username must be at least 3 characters."
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters."
        });
    }

    next();

}

module.exports = {
    validateRegister
};