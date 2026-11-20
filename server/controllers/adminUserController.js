
const mongoose = require("mongoose");
const User = require("../models/User");

// Escape special characters in search input before using it in a regex.

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// GET ALL CUSTOMERS
// Supports pagination, search and account-status filtering.
const getAllCustomers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const search = (req.query.search || "").trim();
    const status = req.query.status;

    const filter = {
      role: "customer",
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

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");

      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [customers, totalCustomers] = await Promise.all([
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
      count: customers.length,
      totalCustomers,
      currentPage: page,
      totalPages: Math.ceil(totalCustomers / limit),
      customers,
    });
  } catch (error) {
    console.error("Get customers error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve customers.",
    });
  }
};

// GET ONE CUSTOMER
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    const customer = await User.findOne({
      _id: id,
      role: "customer",
    }).select(
      "firstName lastName email phone role isActive createdAt updatedAt"
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Get customer error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve customer details.",
    });
  }
};

// ACTIVATE OR DEACTIVATE A CUSTOMER ACCOUNT
const updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    // Only customer accounts can be changed through this endpoint.
    const customer = await User.findOne({
      _id: id,
      role: "customer",
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (customer.isActive === isActive) {
      return res.status(200).json({
        success: true,
        message: `Customer account is already ${
          isActive ? "active" : "inactive"
        }.`,
        customer: {
          id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          isActive: customer.isActive,
        },
      });
    }

    customer.isActive = isActive;
    await customer.save();

    return res.status(200).json({
      success: true,
      message: `Customer account ${
        isActive ? "activated" : "deactivated"
      } successfully.`,
      customer: {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        isActive: customer.isActive,
      },
    });
  } catch (error) {
    console.error("Update customer status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update customer account status.",
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  updateCustomerStatus,
};
