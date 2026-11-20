
const express = require("express");

const {
  createProduct,
  getProducts,
  getAdminProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Administrator-only product listing.
// Must appear before the public /:id route.
router.get(
  "/admin",
  protect,
  authorize("admin"),
  getAdminProducts
);

// Public routes: customers can view active products.
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin-only product management.
router.post("/", protect, authorize("admin"), createProduct);
router.put("/:id", protect, authorize("admin"), updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

module.exports = router;
