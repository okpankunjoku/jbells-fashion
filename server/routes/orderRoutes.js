
const express = require("express");

const orderController = require("../controllers/orderController");

const {
  getAdminSalesReport,
} = require("../controllers/adminSalesReportController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// All order routes require authentication.
router.use(protect);

// Customer routes.
router.post("/", orderController.createOrder);
router.get("/my-orders", orderController.getMyOrders);
router.put("/:id/cancel", orderController.cancelMyOrder);

// Administrator sales reports.
router.get(
  "/admin/reports",
  authorize("admin"),
  getAdminSalesReport
);

// Administrator order management.
router.get("/", authorize("admin"), orderController.getAllOrders);

router.put(
  "/:id/status",
  authorize("admin"),
  orderController.updateOrderStatus
);

// Retrieve an individual order.
router.get("/:id", orderController.getOrderById);

module.exports = router;
