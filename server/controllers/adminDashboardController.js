
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Category = require("../models/Category");

// GET ADMIN DASHBOARD SUMMARY
// GET /api/admin/dashboard
const getDashboardSummary = async (req, res) => {
  try {
    const [
      totalCustomers,
      totalProducts,
      totalCategories,
      totalOrders,
      paidOrders,
      pendingOrders,
      recentOrders,
      products,
    ] = await Promise.all([
      User.countDocuments({
        role: "customer",
        isActive: true,
      }),

      Product.countDocuments({
        status: "active",
      }),

      Category.countDocuments({
        isActive: true,
      }),

      Order.countDocuments(),

      Order.find({
        paymentStatus: "paid",
      }).select("totalAmount"),

      Order.countDocuments({
        orderStatus: "pending",
      }),

      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "firstName lastName email"),

      Product.find({
        status: "active",
      }).select("name variants"),
    ]);

    // Calculate revenue from successfully paid orders.
    const totalRevenue = paidOrders.reduce(
      (total, order) => total + order.totalAmount,
      0
    );

    // Identify product variations with low stock.
    const lowStockProducts = [];

    for (const product of products) {
      for (const variant of product.variants) {
        if (variant.stock <= 5) {
          lowStockProducts.push({
            productId: product._id,
            productName: product.name,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,

      summary: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        totalCategories,
        pendingOrders,
        lowStockCount: lowStockProducts.length,
      },

      recentOrders,

      lowStockProducts: lowStockProducts.slice(0, 10),
    });
  } catch (error) {
    console.error("Admin dashboard error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve dashboard information.",
    });
  }
};

module.exports = {
  getDashboardSummary,
};
