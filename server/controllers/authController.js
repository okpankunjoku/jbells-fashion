
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { sendEmail } = require("../services/emailService");
const welcomeEmail = require("../templates/welcomeEmail");
const passwordResetEmail = require("../templates/passwordResetEmail");

// ==========================================
// PASSWORD VALIDATION
// ==========================================

const isValidPasswordLength = (password) => {
  return (
    password.length >= 8 &&
    Buffer.byteLength(password, "utf8") <= 72
  );
};

// ==========================================
// JWT AUTHENTICATION
// ==========================================

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      tokenVersion: user.tokenVersion || 0,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      algorithm: "HS256",
    }
  );
};

// ==========================================
// TOKEN HELPERS
// ==========================================

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const generateSecureToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// ==========================================
// FRONTEND URL
// ==========================================

const getClientUrl = () => {
  return (
    process.env.CLIENT_URL || "http://localhost:5173"
  ).replace(/\/+$/, "");
};

// ==========================================
// EMAIL VERIFICATION EMAIL
// ==========================================

const sendVerificationEmail = async (user, rawToken) => {
  const verificationUrl =
    `${getClientUrl()}/verify-email/${rawToken}`;

  const emailContent = welcomeEmail(
    user.firstName,
    verificationUrl
  );

  return sendEmail({
    to: user.email,
    toName: user.firstName,
    subject: emailContent.subject,
    htmlContent: emailContent.htmlContent,
    textContent: emailContent.textContent,
  });
};

// ==========================================
// REGISTER CUSTOMER
// POST /api/auth/register
// ==========================================

const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
    } = req.body || {};

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid input provided.",
      });
    }

    if (!firstName.trim() || !lastName.trim()) {
      return res.status(400).json({
        success: false,
        message: "First name and last name cannot be empty.",
      });
    }

    if (firstName.trim().length > 50 || lastName.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: "Names cannot exceed 50 characters.",
      });
    }

    if (!isValidPasswordLength(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters and cannot exceed 72 UTF-8 bytes.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      normalizedEmail.length > 254 ||
      !emailRegex.test(normalizedEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists. Please log in or request another verification email.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate a secure email verification token.
    const verificationToken = generateSecureToken();
    const hashedVerificationToken = hashToken(verificationToken);

    // Create an unverified customer account.
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "customer",
      isActive: true,
      isEmailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ),
    });

    let emailSent = false;

    try {
      await sendVerificationEmail(user, verificationToken);
      emailSent = true;
    } catch (emailError) {
      console.error(
        "Verification email could not be sent:",
        emailError.message
      );
    }

    return res.status(201).json({
      success: true,
      emailSent,
      message: emailSent
        ? "Account created successfully. Please check your email to verify your account."
        : "Your account was created, but we could not send the verification email. Please request another verification email.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isEmailVerified: false,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create account.",
    });
  }
};

// ==========================================
// VERIFY CUSTOMER EMAIL
// POST /api/auth/verify-email/:token
// ==========================================

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification link.",
      });
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
      isEmailVerified: false,
      isActive: true,
    }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "This verification link is invalid or has expired. Please request a new verification email.",
      });
    }

    // Activate the verified email.
    user.isEmailVerified = true;

    // Remove the verification token after successful verification.
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Your email address has been verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error.message);

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify your email address. Please try again.",
    });
  }
};

// ==========================================
// RESEND VERIFICATION EMAIL
// POST /api/auth/resend-verification
// ==========================================

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body || {};

    const responseMessage =
      "If an unverified account exists with this email, a verification email will be sent.";

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // $ne: true also finds older records where the field is missing.
    const user = await User.findOne({
      email: normalizedEmail,
      role: "customer",
      isActive: true,
      isEmailVerified: { $ne: true },
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: responseMessage,
      });
    }

    const verificationToken = generateSecureToken();

    user.emailVerificationToken = hashToken(verificationToken);
    user.emailVerificationExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await user.save();

    try {
      await sendVerificationEmail(user, verificationToken);
    } catch (emailError) {
      console.error(
        "Resend verification email failed:",
        emailError.message
      );

      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;

      await user.save();

      return res.status(500).json({
        success: false,
        message:
          "Unable to send verification email. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message: responseMessage,
    });
  } catch (error) {
    console.error("Resend verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process your request.",
    });
  }
};

// ==========================================
// LOGIN CUSTOMER / ADMIN
// POST /api/auth/login
// ==========================================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email and password.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Require verification for customers, but preserve admin access.
    if (
      user.role === "customer" &&
      user.isEmailVerified !== true
    ) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message:
          "Please verify your email address before logging in.",
        email: user.email,
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified === true,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in.",
    });
  }
};

// ==========================================
// REQUEST PASSWORD RESET
// POST /api/auth/forgot-password
// ==========================================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verified customers and active admins can request a reset.
    const user = await User.findOne({
      email: normalizedEmail,
      isActive: true,
      $or: [
        { role: "admin" },
        {
          role: "customer",
          isEmailVerified: true,
        },
      ],
    });

    const responseMessage =
      "If an active verified account exists with this email, password reset instructions will be provided.";

    if (!user) {
      return res.status(200).json({
        success: true,
        message: responseMessage,
      });
    }

    const resetToken = generateSecureToken();
    const hashedResetToken = hashToken(resetToken);

    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await user.save({ validateBeforeSave: false });

    const resetUrl =
      `${getClientUrl()}/reset-password/${resetToken}`;

    try {
      const emailContent = passwordResetEmail(
        user.firstName,
        resetUrl
      );

      await sendEmail({
        to: user.email,
        toName: user.firstName,
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
        textContent: emailContent.textContent,
      });
    } catch (emailError) {
      console.error(
        "Password-reset email could not be sent:",
        emailError.message
      );

      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message:
          "Unable to send password reset instructions. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message: responseMessage,
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process your password reset request.",
    });
  }
};

// ==========================================
// RESET PASSWORD
// POST /api/auth/reset-password/:token
// ==========================================

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body || {};

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: "A valid reset token is required.",
      });
    }

    if (typeof newPassword !== "string" || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide your new password.",
      });
    }

    if (!isValidPasswordLength(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters and cannot exceed 72 UTF-8 bytes.",
      });
    }

    const hashedResetToken = hashToken(token);

    // Verified customers and admins can reset their passwords.
    const user = await User.findOne({
      resetPasswordToken: hashedResetToken,
      resetPasswordExpires: { $gt: new Date() },
      isActive: true,
      $or: [
        { role: "admin" },
        {
          role: "customer",
          isEmailVerified: true,
        },
      ],
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Password reset token is invalid or has expired.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);

    // Invalidate previously issued login tokens.
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    // Remove the used reset token.
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to reset your password.",
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  loginUser,
  forgotPassword,
  resetPassword,
};
