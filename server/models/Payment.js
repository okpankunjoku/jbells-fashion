
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    provider: {
      type: String,
      enum: ["paystack"],
      default: "paystack",
      required: true,
    },

    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "NGN",
      uppercase: true,
    },

    status: {
      type: String,
      enum: [
        "initialized",
        "pending",
        "success",
        "failed",
        "abandoned",
      ],
      default: "initialized",
    },

    channel: {
      type: String,
      default: "",
    },

    gatewayResponse: {
      type: String,
      default: "",
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Quickly find all payments belonging to an order.
paymentSchema.index({ order: 1, createdAt: -1 });

// Quickly find a customer's payment history.
paymentSchema.index({ user: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
