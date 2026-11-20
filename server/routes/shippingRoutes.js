
const express = require("express");

const {
  getShippingRates,
  getShippingRateByState,
  createShippingRate,
  updateShippingRate,
  deactivateShippingRate,
} = require("../controllers/shippingController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes: customers can view delivery rates.
router.get("/", getShippingRates);
router.get("/state/:state", getShippingRateByState);

// Admin-only routes: manage delivery rates.
router.post(
  "/",
  protect,
  authorize("admin"),
  createShippingRate
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateShippingRate
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deactivateShippingRate
);

module.exports = router;
