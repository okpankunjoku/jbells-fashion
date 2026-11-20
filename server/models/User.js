
const mongoose = require("mongoose");

// Customer delivery address schema.
const addressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    postalCode: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },

    deliveryInstructions: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },

    // SAVED DELIVERY ADDRESSES
    addresses: {
      type: [addressSchema],
      default: [],
      validate: {
        validator: (addresses) => addresses.length <= 10,
        message: "You can save a maximum of 10 delivery addresses.",
      },
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // EMAIL VERIFICATION
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      default: undefined,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      default: undefined,
      select: false,
    },

    // JWT TOKEN VERSION
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },

    // PASSWORD RESET
    resetPasswordToken: {
      type: String,
      default: undefined,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      default: undefined,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
