const express = require("express");

const auth = require("../middleware/auth");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/profile", auth, authController.profile);
router.put("/profile", auth, authController.updateProfile);
router.put("/change-password", auth, authController.changePassword);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.post("/logout", auth, authController.logout);

router.delete("/account", auth, authController.deleteAccount);

module.exports = router;
