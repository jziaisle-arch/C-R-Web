const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const db = require("../database/db");

// Register
exports.register = async (req, res) => {

    try {

        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        // Check if username or email already exists
        db.get(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            [username, email],
            async (err, user) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Database error."
                    });
                }

                if (user) {
                    return res.status(409).json({
                        success: false,
                        message: "Username or email already exists."
                    });
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Save user
                db.run(
                    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                    [username, email, hashedPassword],
                    function (err) {

                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: "Registration failed."
                            });
                        }

                        res.status(201).json({
                            success: true,
                            message: "Account created successfully.",
                            userId: this.lastID
                        });

                    }
                );

            }
        );

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Server error."
        });

    }

};

// Login
exports.login = (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required."
        });
    }

    db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async (err, user) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error."
                });
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid username or password."
                });
            }

            const validPassword = await bcrypt.compare(
                password,
                user.password
            );

            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid username or password."
                });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "7d"
                }
            );

            res.json({
                success: true,
                message: "Login successful.",
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    createdAt: user.createdAt
                }
            });

        }
    );

};

// Get Profile
exports.profile = (req, res) => {

    db.get(
        "SELECT id, username, email, createdAt FROM users WHERE id = ?",
        [req.user.id],
        (err, user) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error."
                });
            }

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }

            res.json({
                success: true,
                user
            });

        }
    );

};

// Update Profile
exports.updateProfile = (req, res) => {

    const { username, email } = req.body;

    if (!username || !email) {
        return res.status(400).json({
            success: false,
            message: "Username and email are required."
        });
    }

    // Check if username or email is already used by another account
    db.get(
        "SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?",
        [username, email, req.user.id],
        (err, existingUser) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error."
                });
            }

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Username or email already exists."
                });
            }

            db.run(
                "UPDATE users SET username = ?, email = ? WHERE id = ?",
                [username, email, req.user.id],
                function (err) {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Failed to update profile."
                        });
                    }

                    res.json({
                        success: true,
                        message: "Profile updated successfully."
                    });

                }
            );

        }
    );

};

// Change Password
exports.changePassword = async (req, res) => {
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Current password and new password are required."
        });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: "New password must be at least 6 characters."
        });
    }
    
    db.get(
        "SELECT password FROM users WHERE id = ?",
        [req.user.id],
        async (err, user) => {
            
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error."
                });
            }
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }
            
            const validPassword = await bcrypt.compare(
                currentPassword,
                user.password
            );
            
            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    message: "Current password is incorrect."
                });
            }
            
            const hashedPassword = await bcrypt.hash(
                newPassword,
                10
            );
            
            db.run(
                "UPDATE users SET password = ? WHERE id = ?",
                [hashedPassword, req.user.id],
                function(err) {
                    
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Failed to change password."
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: "Password changed successfully."
                    });
                    
                }
            );
            
        }
    );
    
};

// Forgot Password
exports.forgotPassword = (req, res) => {
    
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required."
        });
    }
    
    db.get(
        "SELECT id FROM users WHERE email = ?",
        [email],
        (err, user) => {
            
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error."
                });
            }
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Email not found."
                });
            }
            
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString("hex");
            
            db.run(
                "UPDATE users SET resetToken = ? WHERE id = ?",
                [resetToken, user.id],
                function(err) {
                    
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Failed to generate reset token."
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: "Reset token generated successfully.",
                        resetToken
                    });
                    
                }
            );
            
        }
    );
    
};

// Reset Password
exports.resetPassword = async (req, res) => {
    
    const { resetToken, newPassword } = req.body;
    
    if (!resetToken || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Reset token and new password are required."
        });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: "New password must be at least 6 characters."
        });
    }
    
    db.get(
        "SELECT id FROM users WHERE resetToken = ?",
        [resetToken],
        async (err, user) => {
            
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error."
                });
            }
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid reset token."
                });
            }
            
            const hashedPassword = await bcrypt.hash(
                newPassword,
                10
            );
            
            db.run(
                "UPDATE users SET password = ?, resetToken = NULL WHERE id = ?",
                [hashedPassword, user.id],
                function(err) {
                    
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Failed to reset password."
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: "Password reset successfully."
                    });
                    
                }
            );
            
        }
    );
    
};

// Logout
exports.logout = (req, res) => {

    res.json({
        success: true,
        message: "Logged out successfully."
    });

};

// Delete Account
exports.deleteAccount = (req, res) => {
    
    db.run(
        "DELETE FROM users WHERE id = ?",
        [req.user.id],
        function(err) {
            
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error."
                });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }
            
            res.json({
                success: true,
                message: "Account deleted successfully."
            });
            
        }
    );
    
};