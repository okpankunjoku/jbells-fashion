
const express = require("express");

const {
  getInventory,
  getInventorySummary,
  updateVariantStock,
  getInventoryMovements,
} = require("../controllers/inventoryController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// All inventory routes require administrator access.
router.use(protect);
router.use(authorize("admin"));

// GET inventory summary.
router.get("/summary", getInventorySummary);

// GET inventory movement history.
router.get("/history", getInventoryMovements);

// GET inventory.
router.get("/", getInventory);

// UPDATE product variant stock.
router.put(
  "/:productId/variants/:variantId",
  updateVariantStock
);

module.exports = router;
