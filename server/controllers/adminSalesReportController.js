
const Order = require("../models/Order");

// Convert YYYY-MM-DD into a UTC date boundary.
const parseDate = (value, endOfDay = false) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  // Reject impossible dates such as 2026-02-31.
  if (date.toISOString().slice(0, 10) !== value) {
    return null;
  }

  return date;
};

// Admin sales report.
const getAdminSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const match = {};

    if (startDate || endDate) {
      match.createdAt = {};

      if (startDate) {
        const parsedStart = parseDate(startDate);

        if (!parsedStart) {
          return res.status(400).json({
            success: false,
            message: "Invalid startDate. Use YYYY-MM-DD.",
          });
        }

        match.createdAt.$gte = parsedStart;
      }

      if (endDate) {
        const parsedEnd = parseDate(endDate, true);

        if (!parsedEnd) {
          return res.status(400).json({
            success: false,
            message: "Invalid endDate. Use YYYY-MM-DD.",
          });
        }

        match.createdAt.$lte = parsedEnd;
      }

      if (
        match.createdAt.$gte &&
        match.createdAt.$lte &&
        match.createdAt.$gte > match.createdAt.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "startDate cannot be later than endDate.",
        });
      }
    }

    const [
      summaryResult,
      statusBreakdown,
      dailySales,
      topProducts,
    ] = await Promise.all([
      // Overall order and revenue figures.
      Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },

            totalOrderValue: {
              $sum: "$totalAmount",
            },

            deliveredOrders: {
              $sum: {
                $cond: [
                  { $eq: ["$orderStatus", "delivered"] },
                  1,
                  0,
                ],
              },
            },

            deliveredSalesValue: {
              $sum: {
                $cond: [
                  { $eq: ["$orderStatus", "delivered"] },
                  "$totalAmount",
                  0,
                ],
              },
            },

            collectedRevenue: {
              $sum: {
                $cond: [
                  { $eq: ["$paymentStatus", "paid"] },
                  "$totalAmount",
                  0,
                ],
              },
            },

            pendingOrders: {
              $sum: {
                $cond: [
                  { $eq: ["$orderStatus", "pending"] },
                  1,
                  0,
                ],
              },
            },

            pendingOrderValue: {
              $sum: {
                $cond: [
                  { $eq: ["$orderStatus", "pending"] },
                  "$totalAmount",
                  0,
                ],
              },
            },

            cancelledOrders: {
              $sum: {
                $cond: [
                  { $eq: ["$orderStatus", "cancelled"] },
                  1,
                  0,
                ],
              },
            },

            cancelledOrderValue: {
              $sum: {
                $cond: [
                  { $eq: ["$orderStatus", "cancelled"] },
                  "$totalAmount",
                  0,
                ],
              },
            },

            totalShippingFees: {
              $sum: "$shippingFee",
            },

            totalDiscounts: {
              $sum: "$discount",
            },

            averageOrderValue: {
              $avg: {
                $cond: [
                  { $ne: ["$orderStatus", "cancelled"] },
                  "$totalAmount",
                  null,
                ],
              },
            },
          },
        },
      ]),

      // Breakdown by order status.
      Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$orderStatus",
            count: { $sum: 1 },
            orderValue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Daily sales figures, excluding cancelled orders.
      Order.aggregate([
        { $match: match },
        {
          $match: {
            orderStatus: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Africa/Lagos",
              },
            },
            orders: { $sum: 1 },
            orderValue: { $sum: "$totalAmount" },
            collectedRevenue: {
              $sum: {
                $cond: [
                  { $eq: ["$paymentStatus", "paid"] },
                  "$totalAmount",
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Best-selling products, excluding cancelled orders.
      Order.aggregate([
        { $match: match },
        {
          $match: {
            orderStatus: { $ne: "cancelled" },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: {
              product: "$items.product",
              productName: "$items.productName",
              variantSku: "$items.variantSku",
            },
            unitsSold: { $sum: "$items.quantity" },
            salesValue: { $sum: "$items.subtotal" },
          },
        },
        { $sort: { unitsSold: -1, salesValue: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            productId: "$_id.product",
            productName: "$_id.productName",
            variantSku: "$_id.variantSku",
            unitsSold: 1,
            salesValue: 1,
          },
        },
      ]),
    ]);

    const summary = summaryResult[0] || {
      totalOrders: 0,
      totalOrderValue: 0,
      deliveredOrders: 0,
      deliveredSalesValue: 0,
      collectedRevenue: 0,
      pendingOrders: 0,
      pendingOrderValue: 0,
      cancelledOrders: 0,
      cancelledOrderValue: 0,
      totalShippingFees: 0,
      totalDiscounts: 0,
      averageOrderValue: 0,
    };

    return res.status(200).json({
      success: true,
      message: "Sales report retrieved successfully.",
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      summary,
      statusBreakdown,
      dailySales,
      topProducts,
    });
  } catch (error) {
    console.error("Admin sales report error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate sales report.",
    });
  }
};

module.exports = {
  getAdminSalesReport,
};
