const express = require("express");

const {
  getInventoryHistory,
  getProductInventoryHistory,
} = require("../controllers/inventoryHistoryController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// All inventory history routes require administrator access.
router.use(protect);
router.use(authorize("admin"));

// GET all inventory movement history
// GET /api/inventory/history
router.get("/", getInventoryHistory);

// GET inventory history for one product
// GET /api/inventory/history/product/:productId
router.get("/product/:productId", getProductInventoryHistory);

module.exports = router;