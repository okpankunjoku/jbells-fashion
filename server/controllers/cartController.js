
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Find the logged-in customer's cart.
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
    });
  }

  return cart;
};

// Calculate cart totals using current product prices.
const buildCartResponse = async (cart) => {
  await cart.populate("items.product", "name slug price images status variants");

  let subtotal = 0;
  const items = [];

  for (const item of cart.items) {
    const product = item.product;

    if (!product) {
      continue;
    }

    const variant = product.variants.find(
      (entry) => entry.sku === item.variantSku
    );

    if (!variant) {
      continue;
    }

    const unitPrice = product.price;
    const itemSubtotal = unitPrice * item.quantity;

    subtotal += itemSubtotal;

    items.push({
      id: item._id,
      product: {
        id: product._id,
        name: product.name,
        slug: product.slug,
        images: product.images,
      },
      variantSku: item.variantSku,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPrice,
      subtotal: itemSubtotal,
      availableStock: variant.stock,
    });
  }

  return {
    id: cart._id,
    items,
    totalItems: items.reduce((total, item) => total + item.quantity, 0),
    subtotal,
    updatedAt: cart.updatedAt,
  };
};

// GET /api/cart
const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const cartData = await buildCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Cart retrieved successfully.",
      cart: cartData,
    });
  } catch (error) {
    console.error("Get cart error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve cart.",
    });
  }
};

// POST /api/cart
const addToCart = async (req, res) => {
  try {
    const { productId, variantSku, quantity = 1 } = req.body;

    if (!productId || !variantSku) {
      return res.status(400).json({
        success: false,
        message: "Product ID and variant SKU are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive whole number.",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      status: "active",
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable.",
      });
    }

    const variant = product.variants.find(
      (entry) => entry.sku === variantSku
    );

    if (!variant) {
      return res.status(400).json({
        success: false,
        message: "Selected product variant does not exist.",
      });
    }

    const cart = await getOrCreateCart(req.user._id);

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.variantSku === variantSku
    );

    const requestedQuantity =
      quantity + (existingItem ? existingItem.quantity : 0);

    if (requestedQuantity > variant.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${variant.stock} units are available for this variation.`,
      });
    }

    if (existingItem) {
      existingItem.quantity = requestedQuantity;
    } else {
      cart.items.push({
        product: product._id,
        variantSku: variant.sku,
        size: variant.size || "",
        color: variant.color || "",
        quantity,
      });
    }

    await cart.save();

    const cartData = await buildCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully.",
      cart: cartData,
    });
  } catch (error) {
    console.error("Add to cart error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to add product to cart.",
    });
  }
};

// PUT /api/cart/:itemId
const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID.",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive whole number.",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found.",
      });
    }

    const product = await Product.findOne({
      _id: item.product,
      status: "active",
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product is no longer available.",
      });
    }

    const variant = product.variants.find(
      (entry) => entry.sku === item.variantSku
    );

    if (!variant) {
      return res.status(400).json({
        success: false,
        message: "Product variation is no longer available.",
      });
    }

    if (quantity > variant.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${variant.stock} units are available.`,
      });
    }

    item.quantity = quantity;

    await cart.save();

    const cartData = await buildCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated successfully.",
      cart: cartData,
    });
  } catch (error) {
    console.error("Update cart error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update cart item.",
    });
  }
};

// DELETE /api/cart/:itemId
const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID.",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found.",
      });
    }

    item.deleteOne();

    await cart.save();

    const cartData = await buildCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Product removed from cart successfully.",
      cart: cartData,
    });
  } catch (error) {
    console.error("Remove cart item error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to remove cart item.",
    });
  }
};

// DELETE /api/cart
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is already empty.",
      });
    }

    cart.items = [];

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully.",
      cart: {
        id: cart._id,
        items: [],
        totalItems: 0,
        subtotal: 0,
      },
    });
  } catch (error) {
    console.error("Clear cart error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to clear cart.",
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
