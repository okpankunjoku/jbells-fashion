
const express = require("express");

const {
  getAllCustomers,
  getCustomerById,
  updateCustomerStatus,
} = require("../controllers/adminUserController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// All customer-management routes require administrator access.
router.use(protect);
router.use(authorize("admin"));

// GET all customers
// GET /api/admin/customers
router.get("/", getAllCustomers);

// GET one customer
// GET /api/admin/customers/:id
router.get("/:id", getCustomerById);

// Activate or deactivate a customer
// PATCH /api/admin/customers/:id/status
router.patch("/:id/status", updateCustomerStatus);

module.exports = router;
