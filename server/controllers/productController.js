
const Product = require("../models/Product");
const Category = require("../models/Category");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const InventoryMovement = require("../models/InventoryMovement");
const mongoose = require("mongoose");

// Generate a URL-friendly product slug.
const createSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Handle product errors.
const handleError = (res, error) => {
  console.error("Product error:", error.message);

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A product with this slug already exists.",
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
    message: "An error occurred while processing the product.",
  });
};

// Validate category reference.
const validateCategory = async (categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return null;
  }

  return Category.findOne({
    _id: categoryId,
    isActive: true,
  });
};

// Normalize variation values for comparison.
const normalizeValue = (value) => {
  return String(value || "").trim().toLowerCase();
};

// Protect variations referenced by carts or orders.
const protectReferencedVariantChanges = async (
  product,
  incomingVariants
) => {
  if (!Array.isArray(incomingVariants)) {
    throw new Error("Product variations must be provided as an array.");
  }

  for (const existingVariant of product.variants) {
    // Match by embedded variation ID first.
    let incomingVariant = incomingVariants.find(
      (variant) =>
        variant._id &&
        String(variant._id) === String(existingVariant._id)
    );

    // If no ID match exists, try matching by SKU.
    if (!incomingVariant) {
      incomingVariant = incomingVariants.find(
        (variant) =>
          normalizeValue(variant.sku) ===
          normalizeValue(existingVariant.sku)
      );
    }

    // Determine whether this variation is being removed.
    const isRemoved = !incomingVariant;

    // Determine whether its identity is being changed.
    const identityChanged =
      incomingVariant &&
      (
        normalizeValue(incomingVariant.sku) !==
          normalizeValue(existingVariant.sku) ||
        normalizeValue(incomingVariant.size) !==
          normalizeValue(existingVariant.size) ||
        normalizeValue(incomingVariant.color) !==
          normalizeValue(existingVariant.color)
      );

    if (!isRemoved && !identityChanged) {
      continue;
    }

    // Check whether a customer's cart references this variation.
    const cartReference = await Cart.exists({
      items: {
        $elemMatch: {
          product: product._id,
          variantSku: existingVariant.sku,
        },
      },
    });

    // Check whether an existing order references this variation.
    const orderReference = await Order.exists({
      items: {
        $elemMatch: {
          product: product._id,
          variantSku: existingVariant.sku,
        },
      },
    });

    if (cartReference || orderReference) {
      throw new Error(
        `Variation ${existingVariant.sku} cannot be removed or changed because it is referenced by a customer's cart or an existing order.`
      );
    }
  }
};

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      brand,
      price,
      compareAtPrice,
      images,
      variants,
      isFeatured,
      status,
    } = req.body;

    if (
      !name ||
      !description ||
      !category ||
      price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, description, category and price are required.",
      });
    }

    const validCategory = await validateCategory(category);

    if (!validCategory) {
      return res.status(400).json({
        success: false,
        message:
          "Selected category does not exist or is inactive.",
      });
    }

    const slug = createSlug(name);
    console.log(
  "INCOMING PRODUCT VARIATIONS:",
  JSON.stringify(variants, null, 2)
);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid product name.",
      });
    }

    const product = await Product.create({
      name,
      slug,
      description,
      category: validCategory._id,
      brand,
      price,
      compareAtPrice,
      images,
      variants,
      isFeatured,
      status,
    });

    await product.populate("category", "name slug");

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET ALL ACTIVE PRODUCTS
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      featured,
      sort = "newest",
    } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);

    const pageSize = Math.min(
      50,
      Math.max(1, Number(limit) || 12)
    );

    const filter = {
      status: "active",
    };

    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID.",
        });
      }

      filter.category = category;
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    if (search) {
      const safeSearch = String(search).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { brand: { $regex: safeSearch, $options: "i" } },
      ];
    }

    let sortOption = { createdAt: -1 };

    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else if (sort === "price-low") {
      sortOption = { price: 1 };
    } else if (sort === "price-high") {
      sortOption = { price: -1 };
    } else if (sort === "name") {
      sortOption = { name: 1 };
    }

    const totalProducts = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort(sortOption)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      totalProducts,
      currentPage,
      totalPages: Math.ceil(totalProducts / pageSize),
      products,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET ALL PRODUCTS FOR ADMINISTRATION
// Includes active, draft and archived products.
const getAdminProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      status,
      category,
      sort = "newest",
    } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 12));

    const filter = {};

    // Filter by product status when requested.
    if (status && status !== "all") {
      const allowedStatuses = ["active", "draft", "archived"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product status.",
        });
      }

      filter.status = status;
    }

    // Filter by category when requested.
    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID.",
        });
      }

      filter.category = category;
    }

    // Search product name, description and brand.
    if (search && String(search).trim()) {
      const safeSearch = String(search)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { brand: { $regex: safeSearch, $options: "i" } },
      ];
    }

    let sortOption = { createdAt: -1 };

    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else if (sort === "price-low") {
      sortOption = { price: 1 };
    } else if (sort === "price-high") {
      sortOption = { price: -1 };
    } else if (sort === "name") {
      sortOption = { name: 1 };
    }

    const totalProducts = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort(sortOption)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      totalProducts,
      currentPage,
      totalPages: Math.ceil(totalProducts / pageSize),
      products,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET SINGLE PRODUCT BY ID OR SLUG
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    let product = await Product.findOne({
      slug: id,
      status: "active",
    }).populate("category", "name slug");

    if (!product && mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findOne({
        _id: id,
        status: "active",
      }).populate("category", "name slug");
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "category",
      "brand",
      "price",
      "compareAtPrice",
      "images",
      "variants",
      "isFeatured",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid product fields were provided.",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (updates.name !== undefined) {
      if (
        typeof updates.name !== "string" ||
        !updates.name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid product name.",
        });
      }

      updates.name = updates.name.trim();
      updates.slug = createSlug(updates.name);

      if (!updates.slug) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid product name.",
        });
      }
    }

    if (updates.category !== undefined) {
      const validCategory = await validateCategory(
        updates.category
      );

      if (!validCategory) {
        return res.status(400).json({
          success: false,
          message:
            "Selected category does not exist or is inactive.",
        });
      }

      updates.category = validCategory._id;
    }

    // Protect variations referenced by carts or orders.
    if (updates.variants !== undefined) {
      await protectReferencedVariantChanges(
        product,
        updates.variants
      );
    }

    // Apply updates and run full Mongoose validation.
    for (const [field, value] of Object.entries(updates)) {
      product.set(field, value);
    }

    await product.save();
    await product.populate("category", "name slug");

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    if (
      error.message.includes(
        "cannot be removed or changed because it is referenced"
      )
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return handleError(res, error);
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Check customer cart references.
    const cartReference = await Cart.exists({
      "items.product": product._id,
    });

    // Check existing order references.
    const orderReference = await Order.exists({
      "items.product": product._id,
    });

    // Check historical inventory movements.
    const inventoryReference = await InventoryMovement.exists({
      product: product._id,
    });

    if (cartReference || orderReference || inventoryReference) {
      return res.status(409).json({
        success: false,
        message:
          "This product cannot be permanently deleted because it has existing cart, order, or inventory history references. Archive it instead.",
      });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getAdminProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
