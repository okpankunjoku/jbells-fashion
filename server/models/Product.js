
const mongoose = require("mongoose");

// Product variant schema
// Each variant represents a particular size and colour.
const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, "Variant SKU is required"],
      trim: true,
      uppercase: true,
    },

    size: {
      type: String,
      trim: true,
      required: [true, "Product size is required"],
    },

    color: {
      type: String,
      trim: true,
      required: [true, "Product colour is required"],
    },

    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number.",
      },
    },
  },
  {
    _id: true,
  }
);

// Main product schema
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: 5000,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },

    brand: {
      type: String,
      trim: true,
      default: "",
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Product price cannot be negative"],
    },

    compareAtPrice: {
      type: Number,
      min: [0, "Comparison price cannot be negative"],
      default: null,
    },

    images: {
      type: [String],
      default: [],
    },

    variants: {
      type: [variantSchema],
      default: [],

      // Prevent duplicate SKUs within the same product.
      validate: {
        validator: function (variants) {
          const skus = variants.map((variant) =>
            variant.sku.trim().toUpperCase()
          );

          return new Set(skus).size === skus.length;
        },
        message: "Product variants must have unique SKUs.",
      },
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate size and colour combinations.
productSchema.path("variants").validate({
  validator: function (variants) {
    const combinations = variants.map((variant) => {
      const size = variant.size.trim().toLowerCase();
      const color = variant.color.trim().toLowerCase();

      return `${size}-${color}`;
    });

    return new Set(combinations).size === combinations.length;
  },
  message: "Duplicate size and colour combinations are not allowed.",
});

// Enforce globally unique SKUs across different products.
productSchema.index(
  { "variants.sku": 1 },
  {
    unique: true,
    name: "unique_variant_sku",
  }
);

// Create and export Product model
const Product = mongoose.model("Product", productSchema);

module.exports = Product;
