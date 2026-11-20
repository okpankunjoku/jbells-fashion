
const express = require("express");

const {
  getStoreSettings,
  updateStoreSettings,
} = require("../controllers/storeSettingController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// All store settings routes require administrator authentication.
router.use(protect);
router.use(authorize("admin"));

// Retrieve store settings.
router.get("/", getStoreSettings);

// Update store settings.
router.put("/", updateStoreSettings);

module.exports = router;
