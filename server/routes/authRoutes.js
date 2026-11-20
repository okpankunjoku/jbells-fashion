
const express = require("express");

const {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  loginUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

// Customer registration
router.post("/register", registerUser);

// Email verification
router.post("/verify-email/:token", verifyEmail);

// Resend verification email
router.post("/resend-verification", resendVerificationEmail);

// Customer login
router.post("/login", loginUser);

// Password recovery
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
