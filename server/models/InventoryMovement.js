
const mongoose = require("mongoose");

const inventoryMovementSchema = new mongoose.Schema(
  {
    // Product whose inventory was changed.
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Specific product variant whose stock was changed.
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // SKU of the affected variant.
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    // Type of stock adjustment.
    adjustmentType: {
      type: String,
      enum: ["increase", "decrease", "set"],
      required: true,
    },

    previousStock: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Previous stock must be a whole number.",
      },
    },

    newStock: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "New stock must be a whole number.",
      },
    },

    // Absolute difference between previous and new stock.
    quantityChanged: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Quantity changed must be a whole number.",
      },
    },

    // Explanation for the stock adjustment.
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    // User who performed the stock change.
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validate stock movement consistency.
inventoryMovementSchema.pre("validate", function () {
  const actualDifference = Math.abs(
    this.newStock - this.previousStock
  );

  if (this.quantityChanged !== actualDifference) {
    this.invalidate(
      "quantityChanged",
      "Quantity changed must equal the difference between previous and new stock."
    );
  }

  if (
    this.adjustmentType === "increase" &&
    this.newStock <= this.previousStock
  ) {
    this.invalidate(
      "newStock",
      "An increase must result in higher stock."
    );
  }

  if (
    this.adjustmentType === "decrease" &&
    this.newStock >= this.previousStock
  ) {
    this.invalidate(
      "newStock",
      "A decrease must result in lower stock."
    );
  }

  if (
    this.adjustmentType === "set" &&
    this.newStock === this.previousStock
  ) {
    this.invalidate(
      "newStock",
      "A set adjustment must change the stock quantity."
    );
  }
});

// Support inventory history searches by product and date.
inventoryMovementSchema.index({
  product: 1,
  createdAt: -1,
});

// Support inventory history searches by SKU and date.
inventoryMovementSchema.index({
  sku: 1,
  createdAt: -1,
});

// Support searches for adjustments made by a user.
inventoryMovementSchema.index({
  performedBy: 1,
  createdAt: -1,
});

const InventoryMovement = mongoose.model(
  "InventoryMovement",
  inventoryMovementSchema
);

module.exports = InventoryMovement;
