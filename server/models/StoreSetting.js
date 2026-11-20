
const mongoose = require("mongoose");

const storeSettingSchema = new mongoose.Schema(
  {
    // One global settings record for the JBELLS store.
    settingsKey: {
      type: String,
      default: "jbells-store",
      unique: true,
      immutable: true,
    },

    storeName: {
      type: String,
      default: "JBELLS",
      trim: true,
      maxlength: 100,
    },

    contactEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    contactPhone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 25,
    },

    businessAddress: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    currency: {
      type: String,
      default: "NGN",
      enum: ["NGN"],
    },

    country: {
      type: String,
      default: "Nigeria",
      immutable: true,
    },

    // Administrator notification preferences.
    notifications: {
      newOrderEmail: {
        type: Boolean,
        default: true,
      },

      lowStockEmail: {
        type: Boolean,
        default: true,
      },

      orderStatusEmail: {
        type: Boolean,
        default: true,
      },
    },

    // Keep these aligned with the existing checkout configuration.
    deliveryCountry: {
      type: String,
      default: "Nigeria",
      immutable: true,
    },

    paymentMethods: {
      type: [String],
      enum: ["pay_on_delivery"],
      default: ["pay_on_delivery"],
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StoreSetting", storeSettingSchema);
