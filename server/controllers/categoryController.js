
const mongoose = require("mongoose");

const Category = require("../models/Category");
const Product = require("../models/Product");

// Generate a URL-friendly slug
const createSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Handle category errors
const handleError = (res, error) => {
  console.error("Category error:", error.message);

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A category with this name or slug already exists.",
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid category information.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "An error occurred while processing the category.",
  });
};

// CREATE CATEGORY
const createCategory = async (req, res) => {
  try {
    const { name, description, image, displayOrder } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const slug = createSlug(name);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid category name.",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description,
      image,
      displayOrder,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET ALL ACTIVE CATEGORIES
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
    }).sort({
      displayOrder: 1,
      name: 1,
    });

    return res.status(200).json({
      success: true,
      totalCategories: categories.length,
      categories,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET SINGLE CATEGORY BY SLUG
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      slug: id,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// UPDATE CATEGORY
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "image",
      "isActive",
      "displayOrder",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) {
      if (
        typeof updates.name !== "string" ||
        !updates.name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid category name.",
        });
      }

      updates.name = updates.name.trim();
      updates.slug = createSlug(updates.name);

      if (!updates.slug) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid category name.",
        });
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// DELETE CATEGORY
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // Check whether any products still reference this category.
    const productCount = await Product.countDocuments({
      category: category._id,
    });

    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This category cannot be deleted because products are assigned to it. Reassign or remove those products first.",
        productCount,
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
