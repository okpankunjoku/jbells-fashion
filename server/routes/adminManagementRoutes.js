
const express = require("express");

const {
  getAllAdministrators,
  getAdministratorById,
  updateAdministratorStatus,
} = require("../controllers/adminManagementController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// All administrator-management routes require administrator access.
router.use(protect);
router.use(authorize("admin"));

// GET all administrators
// GET /api/admin/administrators
router.get("/", getAllAdministrators);

// GET one administrator
// GET /api/admin/administrators/:id
router.get("/:id", getAdministratorById);

// Activate or deactivate an administrator
// PATCH /api/admin/administrators/:id/status
router.patch("/:id/status", updateAdministratorStatus);

module.exports = router;
