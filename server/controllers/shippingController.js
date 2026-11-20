
const mongoose = require("mongoose");
const ShippingRate = require("../models/ShippingRate");

// All 36 Nigerian states and the Federal Capital Territory.
const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "FCT",
];

const normalizeState = (state) => {
  if (typeof state !== "string") {
    return null;
  }

  const normalized = state.trim().toLowerCase();

  if (normalized === "abuja" || normalized === "federal capital territory") {
    return "FCT";
  }

  return (
    NIGERIAN_STATES.find(
      (item) => item.toLowerCase() === normalized
    ) || null
  );
};

// Handle database errors.
const handleError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A shipping rate already exists for this state.",
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid shipping rate ID.",
    });
  }

  console.error("Shipping error:", error.message);

  return res.status(500).json({
    success: false,
    message: "Something went wrong while processing shipping information.",
  });
};

// CUSTOMER: Get all active shipping rates.
const getShippingRates = async (req, res) => {
  try {
    const rates = await ShippingRate.find({ isActive: true })
      .sort({ state: 1 });

    return res.status(200).json({
      success: true,
      totalRates: rates.length,
      shippingRates: rates,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// CUSTOMER: Get the delivery fee for a particular state.
const getShippingRateByState = async (req, res) => {
  try {
    const state = normalizeState(req.params.state);

    if (!state) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid Nigerian state or FCT.",
      });
    }

    const rate = await ShippingRate.findOne({
      state,
      isActive: true,
    });

    if (!rate) {
      return res.status(404).json({
        success: false,
        message: "Delivery is currently unavailable in this state.",
      });
    }

    return res.status(200).json({
      success: true,
      shippingRate: rate,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// ADMIN: Create a shipping rate.
const createShippingRate = async (req, res) => {
  try {
    const {
      state,
      fee,
      estimatedMinDays,
      estimatedMaxDays,
    } = req.body;

    const normalizedState = normalizeState(state);

    if (!normalizedState) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid Nigerian state or FCT.",
      });
    }

    if (
      fee === undefined ||
      fee === null ||
      fee === "" ||
      !Number.isFinite(Number(fee)) ||
      Number(fee) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid non-negative delivery fee.",
      });
    }

    const minDays = Number(estimatedMinDays ?? 2);
    const maxDays = Number(estimatedMaxDays ?? 5);

    if (
      !Number.isInteger(minDays) ||
      !Number.isInteger(maxDays) ||
      minDays < 1 ||
      maxDays < minDays
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid estimated delivery days.",
      });
    }

    const shippingRate = await ShippingRate.create({
      state: normalizedState,
      fee: Number(fee),
      estimatedMinDays: minDays,
      estimatedMaxDays: maxDays,
    });

    return res.status(201).json({
      success: true,
      message: "Shipping rate created successfully.",
      shippingRate,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// ADMIN: Update an existing shipping rate.
const updateShippingRate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid shipping rate ID.",
      });
    }

    const allowedFields = [
      "state",
      "fee",
      "estimatedMinDays",
      "estimatedMaxDays",
      "isActive",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update.",
      });
    }

    if (updates.state !== undefined) {
      const normalizedState = normalizeState(updates.state);

      if (!normalizedState) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid Nigerian state or FCT.",
        });
      }

      updates.state = normalizedState;
    }

    if (updates.fee !== undefined) {
      if (
        updates.fee === null ||
        updates.fee === "" ||
        !Number.isFinite(Number(updates.fee)) ||
        Number(updates.fee) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid non-negative delivery fee.",
        });
      }

      updates.fee = Number(updates.fee);
    }

    const currentRate = await ShippingRate.findById(id);

    if (!currentRate) {
      return res.status(404).json({
        success: false,
        message: "Shipping rate not found.",
      });
    }

    const minDays =
      updates.estimatedMinDays !== undefined
        ? Number(updates.estimatedMinDays)
        : currentRate.estimatedMinDays;

    const maxDays =
      updates.estimatedMaxDays !== undefined
        ? Number(updates.estimatedMaxDays)
        : currentRate.estimatedMaxDays;

    if (
      !Number.isInteger(minDays) ||
      !Number.isInteger(maxDays) ||
      minDays < 1 ||
      maxDays < minDays
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid estimated delivery days.",
      });
    }

    if (updates.estimatedMinDays !== undefined) {
      updates.estimatedMinDays = minDays;
    }

    if (updates.estimatedMaxDays !== undefined) {
      updates.estimatedMaxDays = maxDays;
    }

    if (
      updates.isActive !== undefined &&
      typeof updates.isActive !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const shippingRate = await ShippingRate.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Shipping rate updated successfully.",
      shippingRate,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// ADMIN: Deactivate a shipping rate instead of permanently deleting it.
const deactivateShippingRate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid shipping rate ID.",
      });
    }

    const shippingRate = await ShippingRate.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!shippingRate) {
      return res.status(404).json({
        success: false,
        message: "Shipping rate not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Shipping rate deactivated successfully.",
      shippingRate,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  getShippingRates,
  getShippingRateByState,
  createShippingRate,
  updateShippingRate,
  deactivateShippingRate,
};
