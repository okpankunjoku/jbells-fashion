
const mongoose = require("mongoose");

const InventoryMovement = require("../models/InventoryMovement");
const Product = require("../models/Product");

// Escape special characters in search input.
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// GET INVENTORY MOVEMENT HISTORY
// GET /api/inventory/history
const getInventoryHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      adjustmentType,
      startDate,
      endDate,
    } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(limit) || 20)
    );

    const filter = {};

    // Filter by adjustment type.
    if (adjustmentType) {
      if (!["increase", "decrease", "set"].includes(adjustmentType)) {
        return res.status(400).json({
          success: false,
          message:
            "Adjustment type must be increase, decrease or set.",
        });
      }

      filter.adjustmentType = adjustmentType;
    }

    // Filter by date range using UTC day boundaries.
    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
          return res.status(400).json({
            success: false,
            message: "Start date must use YYYY-MM-DD format.",
          });
        }

        const start = new Date(`${startDate}T00:00:00.000Z`);

        if (
          Number.isNaN(start.getTime()) ||
          start.toISOString().slice(0, 10) !== startDate
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date.",
          });
        }

        filter.createdAt.$gte = start;
      }

      if (endDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
          return res.status(400).json({
            success: false,
            message: "End date must use YYYY-MM-DD format.",
          });
        }

        const end = new Date(`${endDate}T00:00:00.000Z`);

        if (
          Number.isNaN(end.getTime()) ||
          end.toISOString().slice(0, 10) !== endDate
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date.",
          });
        }

        // Exclusive upper boundary: start of the following UTC day.
        end.setUTCDate(end.getUTCDate() + 1);
        filter.createdAt.$lt = end;
      }

      if (
        filter.createdAt.$gte &&
        filter.createdAt.$lt &&
        filter.createdAt.$gte >= filter.createdAt.$lt
      ) {
        return res.status(400).json({
          success: false,
          message: "Start date cannot be after end date.",
        });
      }
    }

    // Search by SKU, reason or product name.
    if (search && String(search).trim()) {
      const safeSearch = escapeRegex(String(search).trim());
      const searchRegex = new RegExp(safeSearch, "i");

      // Find products whose names match the search.
      const matchingProducts = await Product.find({
        name: searchRegex,
      })
        .select("_id")
        .lean();

      const matchingProductIds = matchingProducts.map(
        (product) => product._id
      );

      filter.$or = [
        { sku: searchRegex },
        { reason: searchRegex },
        { product: { $in: matchingProductIds } },
      ];
    }

    const skip = (currentPage - 1) * pageSize;

    const [movements, totalMovements] = await Promise.all([
      InventoryMovement.find(filter)
        .populate("product", "name slug")
        .populate("performedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),

      InventoryMovement.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: movements.length,
      totalMovements,
      currentPage,
      totalPages: Math.ceil(totalMovements / pageSize),
      movements,
    });
  } catch (error) {
    console.error("Inventory history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve inventory movement history.",
    });
  }
};

// GET INVENTORY HISTORY FOR ONE PRODUCT
// GET /api/inventory/history/product/:productId
const getProductInventoryHistory = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const page = Math.max(
      1,
      parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20)
    );

    const skip = (page - 1) * limit;

    const filter = {
      product: productId,
    };

    const [movements, totalMovements] = await Promise.all([
      InventoryMovement.find(filter)
        .populate("product", "name slug")
        .populate("performedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      InventoryMovement.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: movements.length,
      totalMovements,
      currentPage: page,
      totalPages: Math.ceil(totalMovements / limit),
      movements,
    });
  } catch (error) {
    console.error("Product inventory history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve product inventory history.",
    });
  }
};

module.exports = {
  getInventoryHistory,
  getProductInventoryHistory,
};
