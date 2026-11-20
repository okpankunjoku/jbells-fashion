
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// VERIFY USER AUTHENTICATION
const protect = async (req, res, next) => {
  try {
    let token;

    // Read token from Authorization header.
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check whether token exists.
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please log in.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "Authentication service is not configured.",
      });
    }

    // Verify JWT using the expected signing algorithm.
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // Validate token payload.
    if (
      !decoded.id ||
      !Number.isInteger(decoded.tokenVersion) ||
      decoded.tokenVersion < 0
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // Find the user associated with the token.
    const user = await User.findById(decoded.id);

    // Check whether the account exists and is active.
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account not found or inactive.",
      });
    }

    // Customers must verify their email before accessing protected APIs.
    if (
      user.role === "customer" &&
      user.isEmailVerified !== true
    ) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email address before continuing.",
      });
    }

    // Reject tokens issued before a password reset or change.
    const currentTokenVersion = user.tokenVersion || 0;

    if (decoded.tokenVersion !== currentTokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    // Attach authenticated user to request.
    req.user = user;

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

// CHECK USER ROLE
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action.",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};
