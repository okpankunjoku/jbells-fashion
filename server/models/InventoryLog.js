
const mongoose = require("mongoose");

const inventoryLogSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    size: {
      type: String,
      required: true,
      trim: true,
    },

    color: {
      type: String,
      required: true,
      trim: true,
    },

    changeType: {
      type: String,
      enum: [
        "stock_added",
        "stock_removed",
        "stock_adjusted",
        "order_deduction",
        "order_restoration",
      ],
      required: true,
    },

    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },

    quantityChanged: {
      type: Number,
      required: true,
      min: 1,
    },

    newStock: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reference: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Efficient inventory history searches
inventoryLogSchema.index({
  product: 1,
  createdAt: -1,
});

inventoryLogSchema.index({
  performedBy: 1,
  createdAt: -1,
});

inventoryLogSchema.index({
  changeType: 1,
  createdAt: -1,
});

const InventoryLog = mongoose.model(
  "InventoryLog",
  inventoryLogSchema
);

module.exports = InventoryLog;
