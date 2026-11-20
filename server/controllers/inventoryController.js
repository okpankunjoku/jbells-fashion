
const mongoose = require("mongoose");
const Product = require("../models/Product");
const InventoryMovement = require("../models/InventoryMovement");

// LOW STOCK THRESHOLD
const LOW_STOCK_THRESHOLD = 5;

// GET INVENTORY
const getInventory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      stockStatus,
    } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);

    const pageSize = Math.min(
      100,
      Math.max(1, Number(limit) || 20)
    );

    const filter = {};

    // SEARCH PRODUCTS BY NAME OR BRAND
    if (search && String(search).trim()) {
      const safeSearch = String(search)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { brand: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // VALIDATE STOCK STATUS
    if (
      stockStatus &&
      !["low", "out", "in"].includes(stockStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock status must be low, out or in.",
      });
    }

    // FILTER PRODUCTS BY VARIANT STOCK
    if (stockStatus === "low") {
      filter.variants = {
        $elemMatch: {
          stock: {
            $gt: 0,
            $lte: LOW_STOCK_THRESHOLD,
          },
        },
      };
    } else if (stockStatus === "out") {
      filter.variants = {
        $elemMatch: {
          stock: 0,
        },
      };
    } else if (stockStatus === "in") {
      filter.variants = {
        $elemMatch: {
          stock: {
            $gt: LOW_STOCK_THRESHOLD,
          },
        },
      };
    }

    // COUNT MATCHING PRODUCTS
    const totalProducts = await Product.countDocuments(filter);

    // RETRIEVE PAGINATED PRODUCTS
    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      totalProducts,
      currentPage,
      totalPages: Math.ceil(totalProducts / pageSize),
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      products,
    });
  } catch (error) {
    console.error("Inventory error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve inventory.",
    });
  }
};

// GET INVENTORY SUMMARY
const getInventorySummary = async (req, res) => {
  try {
    const products = await Product.find(
      {},
      "name variants status"
    );

    let totalVariants = 0;
    let totalStockUnits = 0;
    let lowStockVariants = 0;
    let outOfStockVariants = 0;

    for (const product of products) {
      for (const variant of product.variants) {
        totalVariants++;
        totalStockUnits += variant.stock;

        if (variant.stock === 0) {
          outOfStockVariants++;
        } else if (
          variant.stock <= LOW_STOCK_THRESHOLD
        ) {
          lowStockVariants++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      summary: {
        totalProducts: products.length,
        totalVariants,
        totalStockUnits,
        lowStockVariants,
        outOfStockVariants,
        lowStockThreshold: LOW_STOCK_THRESHOLD,
      },
    });
  } catch (error) {
    console.error("Inventory summary error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve inventory summary.",
    });
  }
};

// UPDATE STOCK FOR A PRODUCT VARIANT
const updateVariantStock = async (req, res) => {
  let session;

  try {
    session = await mongoose.startSession();

    const { productId, variantId } = req.params;

    const {
      stock,
      adjustment,
      adjustmentType,
      reason,
    } = req.body;

    // VALIDATE PRODUCT ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    // VALIDATE VARIANT ID
    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid variant ID.",
      });
    }

    // REQUIRE EXACTLY ONE STOCK UPDATE METHOD
    const settingStock = stock !== undefined;
    const adjustingStock = adjustment !== undefined;

    if (settingStock === adjustingStock) {
      return res.status(400).json({
        success: false,
        message:
          "Provide either a stock quantity or an adjustment, not both.",
      });
    }

    // VALIDATE REASON
    if (
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.trim().length > 300
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A reason is required and must not exceed 300 characters.",
      });
    }

    let updatedInventory;

    await session.withTransaction(async () => {
      const product = await Product.findById(productId).session(
        session
      );

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const variant = product.variants.id(variantId);

      if (!variant) {
        throw new Error("VARIANT_NOT_FOUND");
      }

      const previousStock = variant.stock;

      let newStock;
      let finalAdjustmentType;

      // SET AN EXACT STOCK QUANTITY
      if (settingStock) {
        if (!Number.isInteger(stock) || stock < 0) {
          throw new Error("INVALID_STOCK");
        }

        newStock = stock;
        finalAdjustmentType = "set";
      } else {
        // INCREASE OR DECREASE EXISTING STOCK
        if (
          !Number.isInteger(adjustment) ||
          adjustment <= 0
        ) {
          throw new Error("INVALID_ADJUSTMENT");
        }

        if (
          !["increase", "decrease"].includes(adjustmentType)
        ) {
          throw new Error("INVALID_ADJUSTMENT_TYPE");
        }

        finalAdjustmentType = adjustmentType;

        newStock =
          adjustmentType === "increase"
            ? previousStock + adjustment
            : previousStock - adjustment;

        if (newStock < 0) {
          throw new Error("INSUFFICIENT_STOCK");
        }
      }

      // PREVENT UNNECESSARY HISTORY RECORDS
      if (newStock === previousStock) {
        throw new Error("NO_STOCK_CHANGE");
      }

      const quantityChanged = Math.abs(
        newStock - previousStock
      );

      // UPDATE PRODUCT VARIANT STOCK
      variant.stock = newStock;

      await product.save({ session });

      // RECORD INVENTORY MOVEMENT IN THE SAME TRANSACTION
      await InventoryMovement.create(
        [
          {
            product: product._id,
            variantId: variant._id,
            sku: variant.sku,
            adjustmentType: finalAdjustmentType,
            previousStock,
            newStock,
            quantityChanged,
            reason: reason.trim(),
            performedBy: req.user._id,
          },
        ],
        { session }
      );

      updatedInventory = {
        productId: product._id,
        productName: product.name,
        variantId: variant._id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        adjustmentType: finalAdjustmentType,
        previousStock,
        quantityChanged,
        currentStock: newStock,
        stockStatus:
          newStock === 0
            ? "out_of_stock"
            : newStock <= LOW_STOCK_THRESHOLD
              ? "low_stock"
              : "in_stock",
      };
    });

    return res.status(200).json({
      success: true,
      message:
        "Inventory updated and movement history recorded successfully.",
      inventory: updatedInventory,
    });
  } catch (error) {
    console.error("Stock update error:", error.message);

    const knownErrors = {
      PRODUCT_NOT_FOUND: {
        status: 404,
        message: "Product not found.",
      },
      VARIANT_NOT_FOUND: {
        status: 404,
        message: "Product variant not found.",
      },
      INVALID_STOCK: {
        status: 400,
        message: "Stock must be a non-negative whole number.",
      },
      INVALID_ADJUSTMENT: {
        status: 400,
        message: "Adjustment must be a positive whole number.",
      },
      INVALID_ADJUSTMENT_TYPE: {
        status: 400,
        message: "Adjustment type must be increase or decrease.",
      },
      INSUFFICIENT_STOCK: {
        status: 400,
        message: "This adjustment would make stock negative.",
      },
      NO_STOCK_CHANGE: {
        status: 400,
        message:
          "The new stock quantity is the same as the current quantity.",
      },
    };

    const knownError = knownErrors[error.message];

    if (knownError) {
      return res.status(knownError.status).json({
        success: false,
        message: knownError.message,
      });
    }

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update inventory.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// GET INVENTORY MOVEMENT HISTORY
const getInventoryMovements = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      adjustmentType,
    } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);

    const pageSize = Math.min(
      100,
      Math.max(1, Number(limit) || 20)
    );

    const filter = {};

    // FILTER BY ADJUSTMENT TYPE
    if (adjustmentType) {
      if (!["increase", "decrease", "set"].includes(adjustmentType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid adjustment type.",
        });
      }

      filter.adjustmentType = adjustmentType;
    }

    // SEARCH BY SKU OR REASON
    if (search && String(search).trim()) {
      const safeSearch = String(search)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { sku: { $regex: safeSearch, $options: "i" } },
        { reason: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const totalMovements =
      await InventoryMovement.countDocuments(filter);

    const movements = await InventoryMovement.find(filter)
      .populate("product", "name brand")
      .populate("performedBy", "email role")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean();

    return res.status(200).json({
      success: true,
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

// EXPORT INVENTORY CONTROLLERS
module.exports = {
  getInventory,
  getInventorySummary,
  updateVariantStock,
  getInventoryMovements,
};
