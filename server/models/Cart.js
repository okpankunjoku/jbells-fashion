
const mongoose = require("mongoose");

// Each item represents one product variation in a customer's cart.
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product is required"],
  },

  variantSku: {
    type: String,
    required: [true, "Product variant SKU is required"],
    trim: true,
  },

  size: {
    type: String,
    trim: true,
    default: "",
  },

  color: {
    type: String,
    trim: true,
    default: "",
  },

  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
    default: 1,
  },
});

// Each customer has one cart.
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
