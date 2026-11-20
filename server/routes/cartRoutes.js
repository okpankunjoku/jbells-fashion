
const express = require("express");

const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All cart routes require a logged-in customer.
router.use(protect);

// Retrieve the customer's cart.
router.get("/", getCart);

// Add a product to the cart.
router.post("/", addToCart);

// Update a cart item's quantity.
router.put("/:itemId", updateCartItem);

// Remove one product from the cart.
router.delete("/:itemId", removeCartItem);

// Clear the entire cart.
router.delete("/", clearCart);

module.exports = router;
