
const express = require("express");

const {
  getDashboardSummary,
} = require("../controllers/adminDashboardController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Only authenticated administrators can access the dashboard.
router.use(protect);
router.use(authorize("admin"));

// GET /api/admin/dashboard
router.get("/dashboard", getDashboardSummary);

module.exports = router;
