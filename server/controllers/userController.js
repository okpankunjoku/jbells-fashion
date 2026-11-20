
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Check password length using UTF-8 bytes.
// bcrypt supports a maximum of 72 bytes.
const isValidPasswordLength = (password) => {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    Buffer.byteLength(password, "utf8") <= 72
  );
};

// GET /api/users/me
// Retrieve the profile of the currently logged-in user.
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve user profile.",
    });
  }
};

// PUT /api/users/me
// Update the logged-in user's basic profile information.
const updateMyProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const updates = {};

    if (firstName !== undefined) {
      if (typeof firstName !== "string" || !firstName.trim()) {
        return res.status(400).json({
          success: false,
          message: "First name cannot be empty.",
        });
      }

      updates.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (typeof lastName !== "string" || !lastName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Last name cannot be empty.",
        });
      }

      updates.lastName = lastName.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== "string") {
        return res.status(400).json({
          success: false,
          message: "Phone number must be a string.",
        });
      }

      updates.phone = phone.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one profile field to update.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update profile.",
    });
  }
};

// PUT /api/users/me/change-password
// Change the logged-in user's password.
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (!isValidPasswordLength(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "New password must contain at least 8 characters and cannot exceed 72 UTF-8 bytes.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: "Your current password is incorrect.",
      });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message:
          "Your new password must be different from your current password.",
      });
    }

    // Save the new password.
    user.password = await bcrypt.hash(newPassword, 12);

    // Invalidate all previously issued login tokens.
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Please log in again on all devices.",
    });
  } catch (error) {
    console.error("Change password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to change password.",
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
};
