const mongoose = require("mongoose");
const crypto = require("crypto");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const ShippingRate = require("../models/ShippingRate");
const InventoryMovement = require("../models/InventoryMovement");

const { sendEmail } = require("../services/emailService");

const orderConfirmationEmail = require("../templates/orderConfirmationEmail");
const orderStatusEmail = require("../templates/orderStatusEmail");
const adminOrderNotificationEmail = require("../templates/adminOrderNotificationEmail");

// Generate a unique order reference.
const generateOrderNumber = () => {
  const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `ORD-${Date.now()}-${randomPart}`;
};

// Custom error helper.
const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Validate the delivery address.
const validateShippingAddress = (address) => {
  if (!address || typeof address !== "object" || Array.isArray(address)) {
    throw createError("Delivery address is required.");
  }

  const requiredFields = [
    "fullName",
    "phone",
    "email",
    "address",
    "city",
    "state",
  ];

  for (const field of requiredFields) {
    if (
      typeof address[field] !== "string" ||
      !address[field].trim()
    ) {
      throw createError(
        `${field} is required in the delivery address.`
      );
    }
  }

  const email = address.email.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError("Please provide a valid delivery email address.");
  }

  const allowedFields = [
    "fullName",
    "phone",
    "email",
    "address",
    "city",
    "state",
    "country",
    "postalCode",
    "deliveryInstructions",
  ];

  const cleanAddress = {};

  for (const field of allowedFields) {
    if (address[field] !== undefined) {
      if (typeof address[field] !== "string") {
        throw createError(`${field} must be a string.`);
      }

      cleanAddress[field] = address[field].trim();
    }
  }

  cleanAddress.email = email.toLowerCase();
  cleanAddress.country = cleanAddress.country || "Nigeria";

  return cleanAddress;
};

// Record a stock movement inside the current transaction.
const createInventoryMovement = async (
  {
    productId,
    variantId,
    sku,
    adjustmentType,
    previousStock,
    newStock,
    quantityChanged,
    reason,
    performedBy,
  },
  session
) => {
  await InventoryMovement.create(
    [
      {
        product: productId,
        variantId,
        sku,
        adjustmentType,
        previousStock,
        newStock,
        quantityChanged,
        reason,
        performedBy,
      },
    ],
    { session }
  );
};

// Restore stock and record the corresponding inventory movement.
const restoreOrderItemStock = async (
  item,
  reason,
  performedBy,
  session
) => {
  const product = await Product.findById(item.product).session(session);

  if (!product) {
    throw createError(
      `Unable to restore stock for ${item.productName}.`,
      409
    );
  }

  const variant = product.variants.find(
    (entry) =>
      entry.sku.toUpperCase() === item.variantSku.toUpperCase()
  );

  if (!variant) {
    throw createError(
      `Unable to find the selected variation for ${item.productName}.`,
      409
    );
  }

  const previousStock = variant.stock;
  const newStock = previousStock + item.quantity;

  variant.stock = newStock;

  await product.save({ session });

  await createInventoryMovement(
    {
      productId: product._id,
      variantId: variant._id,
      sku: variant.sku,
      adjustmentType: "increase",
      previousStock,
      newStock,
      quantityChanged: item.quantity,
      reason,
      performedBy,
    },
    session
  );
};

// CREATE ORDER
// POST /api/orders
const createOrder = async (req, res) => {
  let session;

  try {
    const {
      shippingAddress,
      paymentMethod = "pay_on_delivery",
    } = req.body;

    const cleanShippingAddress =
      validateShippingAddress(shippingAddress);

    // JBELLS currently accepts Pay on Delivery only.
    const allowedPaymentMethods = ["pay_on_delivery"];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "JBELLS currently accepts Pay on Delivery only.",
      });
    }

    session = await mongoose.startSession();

    let createdOrder;

    await session.withTransaction(async () => {
      const cart = await Cart.findOne({
        user: req.user._id,
      }).session(session);

      if (!cart || cart.items.length === 0) {
        throw createError("Your shopping cart is empty.");
      }

      if (cleanShippingAddress.country.toLowerCase() !== "nigeria") {
        throw createError("We currently deliver within Nigeria only.");
      }

      const requestedState = cleanShippingAddress.state.trim();

      const shippingState =
        /^(abuja|federal capital territory)$/i.test(requestedState)
          ? "FCT"
          : requestedState;

      const escapedState = shippingState.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const shippingRate = await ShippingRate.findOne({
        state: new RegExp(`^${escapedState}$`, "i"),
        isActive: true,
      }).session(session);

      if (!shippingRate) {
        throw createError(
          "Delivery is currently unavailable in this state. Please contact our support team."
        );
      }

      cleanShippingAddress.state = shippingRate.state;

      const orderItems = [];
      const inventoryChanges = [];
      let subtotal = 0;

      // Validate every product and selected variation.
      for (const cartItem of cart.items) {
        const product = await Product.findOne({
          _id: cartItem.product,
          status: "active",
        }).session(session);

        if (!product) {
          throw createError(
            "A product in your cart is no longer available."
          );
        }

        const variant = product.variants.find(
          (entry) =>
            entry.sku.toUpperCase() ===
            cartItem.variantSku.toUpperCase()
        );

        if (!variant) {
          throw createError(
            `The selected variation for ${product.name} is no longer available.`
          );
        }

        if (variant.stock < cartItem.quantity) {
          throw createError(
            `Insufficient stock for ${product.name}. Available quantity: ${variant.stock}.`
          );
        }

        const unitPrice = product.price;
        const itemSubtotal = unitPrice * cartItem.quantity;

        subtotal += itemSubtotal;

        orderItems.push({
          product: product._id,
          productName: product.name,
          productImage: product.images[0] || "",
          variantSku: variant.sku,
          size: variant.size || "",
          color: variant.color || "",
          quantity: cartItem.quantity,
          unitPrice,
          subtotal: itemSubtotal,
        });

        inventoryChanges.push({
          productId: product._id,
          variantId: variant._id,
          sku: variant.sku,
          previousStock: variant.stock,
          quantity: cartItem.quantity,
        });
      }

      const shippingFee = shippingRate.fee;
      const discount = 0;
      const totalAmount = subtotal + shippingFee - discount;

      // Reduce stock safely.
      for (const item of orderItems) {
        const stockUpdate = await Product.updateOne(
          {
            _id: item.product,
            status: "active",
            variants: {
              $elemMatch: {
                sku: item.variantSku,
                stock: { $gte: item.quantity },
              },
            },
          },
          {
            $inc: {
              "variants.$.stock": -item.quantity,
            },
          },
          { session }
        );

        if (stockUpdate.modifiedCount !== 1) {
          throw createError(
            `Stock changed while processing ${item.productName}. Please try checkout again.`,
            409
          );
        }
      }

      const orderNumber = generateOrderNumber();

      // Record each stock deduction in the same transaction.
      for (const change of inventoryChanges) {
        await createInventoryMovement(
          {
            productId: change.productId,
            variantId: change.variantId,
            sku: change.sku,
            adjustmentType: "decrease",
            previousStock: change.previousStock,
            newStock: change.previousStock - change.quantity,
            quantityChanged: change.quantity,
            reason: `Order placed: ${orderNumber}`,
            performedBy: req.user._id,
          },
          session
        );
      }

      const orders = await Order.create(
        [
          {
            orderNumber,
            user: req.user._id,
            items: orderItems,
            shippingAddress: cleanShippingAddress,
            subtotal,
            shippingFee,
            discount,
            totalAmount,
            paymentMethod,
            paymentStatus: "pending",
            orderStatus: "pending",
          },
        ],
        { session }
      );

      createdOrder = orders[0];

      cart.items = [];
      await cart.save({ session });
    });

    // Send customer confirmation after the order transaction succeeds.
    // Email failure must not undo a successfully placed order.
    try {
      const customerName = cleanShippingAddress.fullName;
      const customerEmail = cleanShippingAddress.email;

      const emailContent = orderConfirmationEmail(
        createdOrder,
        { firstName: customerName }
      );

      await sendEmail({
        to: customerEmail,
        toName: customerName,
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
        textContent: emailContent.textContent,
      });
    } catch (emailError) {
      console.error(
        "Order confirmation email failed:",
        emailError.message
      );
    }

    // Notify the administrator about the new order.
    // Admin email failure must not undo a successfully placed order.
    try {
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

      if (!adminEmail || !adminEmail.trim()) {
        console.warn(
          "Admin order notification skipped: ADMIN_NOTIFICATION_EMAIL is not configured."
        );
      } else {
        const adminEmailContent =
          adminOrderNotificationEmail(createdOrder);

        await sendEmail({
          to: adminEmail.trim(),
          toName: "JBELLS Admin",
          subject: adminEmailContent.subject,
          htmlContent: adminEmailContent.htmlContent,
          textContent: adminEmailContent.textContent,
        });

        console.log(
          "Admin order notification email sent successfully."
        );
      }
    } catch (adminEmailError) {
      console.error(
        "Admin order notification email failed:",
        adminEmailError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Your order has been placed successfully.",
      order: createdOrder,
    });
  } catch (error) {
    console.error("Create order error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Unable to place your order.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// GET CUSTOMER ORDER HISTORY
// GET /api/orders/my-orders
const getMyOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "firstName lastName email"),

      Order.countDocuments({ user: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your orders.",
    });
  }
};

// GET ONE ORDER
// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const isValidId = mongoose.Types.ObjectId.isValid(id);

    const orderQuery = isValidId
      ? { _id: id }
      : { orderNumber: id };

    if (req.user.role !== "admin") {
      orderQuery.user = req.user._id;
    }

    const order = await Order.findOne(orderQuery).populate(
      "user",
      "firstName lastName email phone"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve order.",
    });
  }
};
// GET ALL ORDERS
// GET /api/orders
const getAllOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    const filter = {};

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (req.query.status) {
      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status filter.",
        });
      }

      filter.orderStatus = req.query.status;
    }

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "firstName lastName email phone"),

      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      orders,
    });
  } catch (error) {
    console.error("Get all orders error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve orders.",
    });
  }
};

// UPDATE ORDER STATUS
// PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  let session;

  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    session = await mongoose.startSession();

    let updatedOrder;

    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);

      if (!order) {
        throw createError("Order not found.", 404);
      }

      const allowedTransitions = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["processing", "cancelled"],
        processing: ["shipped", "cancelled"],
        shipped: ["delivered"],
        delivered: [],
        cancelled: [],
      };

      const currentStatus = order.orderStatus;

      if (!allowedTransitions[currentStatus]?.includes(orderStatus)) {
        throw createError(
          `An order cannot move from ${currentStatus} to ${orderStatus}.`,
          400
        );
      }

      if (orderStatus === "cancelled") {
        if (order.paymentStatus === "paid") {
          throw createError(
            "Paid orders must be refunded before cancellation.",
            400
          );
        }

        // Restore stock and record each restoration.
        for (const item of order.items) {
          await restoreOrderItemStock(
            item,
            `Order cancelled by administrator: ${order.orderNumber}`,
            req.user._id,
            session
          );
        }

        order.cancelledAt = new Date();
      }

      if (orderStatus === "delivered") {
        order.deliveredAt = new Date();
      }

      order.orderStatus = orderStatus;

      await order.save({ session });

      updatedOrder = order;
    });

    // Send status notification only after the transaction succeeds.
    // Email failure must not undo a successfully updated order.
    try {
      const emailOrder = await Order.findById(updatedOrder._id)
        .populate("user", "firstName lastName email");

      if (emailOrder) {
        const customerName =
          emailOrder.shippingAddress?.fullName ||
          `${emailOrder.user?.firstName || ""} ${
            emailOrder.user?.lastName || ""
          }`.trim();

        const customerEmail =
          emailOrder.shippingAddress?.email ||
          emailOrder.user?.email;

        if (customerEmail) {
          const firstName =
            emailOrder.user?.firstName ||
            customerName.split(/\s+/)[0] ||
            "Customer";

          const emailContent = orderStatusEmail(
            emailOrder,
            { firstName }
          );

          await sendEmail({
            to: customerEmail,
            toName: customerName || firstName,
            subject: emailContent.subject,
            htmlContent: emailContent.htmlContent,
            textContent: emailContent.textContent,
          });
        } else {
          console.warn(
            "Order status email skipped: Customer email not found."
          );
        }
      }
    } catch (emailError) {
      console.error(
        "Order status email failed:",
        emailError.message
      );
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order status error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Unable to update order status.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// CUSTOMER CANCELS THEIR OWN ORDER
// PUT /api/orders/:id/cancel
const cancelMyOrder = async (req, res) => {
  let session;

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    session = await mongoose.startSession();

    let cancelledOrder;

    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: id,
        user: req.user._id,
      }).session(session);

      if (!order) {
        throw createError("Order not found.", 404);
      }

      if (!["pending", "confirmed"].includes(order.orderStatus)) {
        throw createError(
          "This order can no longer be cancelled.",
          400
        );
      }

      if (order.paymentStatus === "paid") {
        throw createError(
          "Paid orders must be refunded before cancellation.",
          400
        );
      }

      // Restore stock and record each restoration.
      for (const item of order.items) {
        await restoreOrderItemStock(
          item,
          `Order cancelled by customer: ${order.orderNumber}`,
          req.user._id,
          session
        );
      }

      order.orderStatus = "cancelled";
      order.cancelledAt = new Date();

      await order.save({ session });

      cancelledOrder = order;
    });

    // Send cancellation notification after the transaction succeeds.
    // Email failure must not undo the successful cancellation.
    try {
      const emailOrder = await Order.findById(cancelledOrder._id)
        .populate("user", "firstName lastName email");

      if (emailOrder) {
        const customerName =
          emailOrder.shippingAddress?.fullName ||
          `${emailOrder.user?.firstName || ""} ${
            emailOrder.user?.lastName || ""
          }`.trim();

        const customerEmail =
          emailOrder.shippingAddress?.email ||
          emailOrder.user?.email;

        if (customerEmail) {
          const firstName =
            emailOrder.user?.firstName ||
            customerName.split(/\s+/)[0] ||
            "Customer";

          const emailContent = orderStatusEmail(
            emailOrder,
            { firstName }
          );

          await sendEmail({
            to: customerEmail,
            toName: customerName || firstName,
            subject: emailContent.subject,
            htmlContent: emailContent.htmlContent,
            textContent: emailContent.textContent,
          });
        } else {
          console.warn(
            "Cancellation email skipped: Customer email not found."
          );
        }
      }
    } catch (emailError) {
      console.error(
        "Customer cancellation email failed:",
        emailError.message
      );
    }

    return res.status(200).json({
      success: true,
      message: "Your order has been cancelled successfully.",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error("Cancel order error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Unable to cancel your order.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// Export controller functions.
module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelMyOrder,
};