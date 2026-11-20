
const mongoose = require("mongoose");
const User = require("../models/User");

// GET ALL ADMINISTRATORS
const getAllAdministrators = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const status = req.query.status;

    const filter = {
      role: "admin",
    };

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    } else if (status && status !== "all") {
      return res.status(400).json({
        success: false,
        message: "Status must be active, inactive or all.",
      });
    }

    const skip = (page - 1) * limit;

    const [administrators, totalAdministrators] = await Promise.all([
      User.find(filter)
        .select("firstName lastName email phone role isActive createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: administrators.length,
      totalAdministrators,
      currentPage: page,
      totalPages: Math.ceil(totalAdministrators / limit),
      administrators,
    });
  } catch (error) {
    console.error("Get administrators error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve administrator accounts.",
    });
  }
};

// GET ONE ADMINISTRATOR
const getAdministratorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid administrator ID.",
      });
    }

    const administrator = await User.findOne({
      _id: id,
      role: "admin",
    }).select(
      "firstName lastName email phone role isActive createdAt updatedAt"
    );

    if (!administrator) {
      return res.status(404).json({
        success: false,
        message: "Administrator account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      administrator,
    });
  } catch (error) {
    console.error("Get administrator error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve administrator details.",
    });
  }
};

// ACTIVATE OR DEACTIVATE AN ADMINISTRATOR
const updateAdministratorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid administrator ID.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    // Find only an administrator account.
    const administrator = await User.findOne({
      _id: id,
      role: "admin",
    });

    if (!administrator) {
      return res.status(404).json({
        success: false,
        message: "Administrator account not found.",
      });
    }

    // Prevent an administrator from deactivating their own account.
    if (
      !isActive &&
      String(administrator._id) === String(req.user._id)
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own administrator account.",
      });
    }

    if (administrator.isActive === isActive) {
      return res.status(200).json({
        success: true,
        message: `Administrator account is already ${
          isActive ? "active" : "inactive"
        }.`,
        administrator: {
          id: administrator._id,
          firstName: administrator.firstName,
          lastName: administrator.lastName,
          email: administrator.email,
          isActive: administrator.isActive,
        },
      });
    }

    // Do not allow the last active administrator to be deactivated.
    if (!isActive) {
      const activeAdministratorCount = await User.countDocuments({
        role: "admin",
        isActive: true,
      });

      if (activeAdministratorCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "The last active administrator cannot be deactivated.",
        });
      }
    }

    administrator.isActive = isActive;
    await administrator.save();

    return res.status(200).json({
      success: true,
      message: `Administrator account ${
        isActive ? "activated" : "deactivated"
      } successfully.`,
      administrator: {
        id: administrator._id,
        firstName: administrator.firstName,
        lastName: administrator.lastName,
        email: administrator.email,
        isActive: administrator.isActive,
      },
    });
  } catch (error) {
    console.error("Update administrator status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update administrator account status.",
    });
  }
};

module.exports = {
  getAllAdministrators,
  getAdministratorById,
  updateAdministratorStatus,
};
