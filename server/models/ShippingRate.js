
const mongoose = require("mongoose");

const shippingRateSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: [true, "Delivery state is required"],
      unique: true,
      trim: true,
    },

    fee: {
      type: Number,
      required: [true, "Delivery fee is required"],
      min: [0, "Delivery fee cannot be negative"],
    },

    estimatedMinDays: {
      type: Number,
      required: true,
      min: 1,
      default: 2,
    },

    estimatedMaxDays: {
      type: Number,
      required: true,
      min: 1,
      default: 5,
      validate: {
        validator: function (value) {
          return value >= this.estimatedMinDays;
        },
        message: "Maximum delivery days cannot be less than minimum days.",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const ShippingRate = mongoose.model(
  "ShippingRate",
  shippingRateSchema
);

module.exports = ShippingRate;
