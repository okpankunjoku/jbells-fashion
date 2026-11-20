
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dns = require("dns");

// Load environment variables
dotenv.config();

// Configure DNS for MongoDB Atlas SRV resolution
dns.setServers(["8.8.8.8", "1.1.1.1"]);

console.log("DNS configured: Google and Cloudflare");

// Database connection
const connectDB = require("./config/db");

// Import routes
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const shippingRoutes = require("./routes/shippingRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminManagementRoutes = require("./routes/adminManagementRoutes");
const inventoryHistoryRoutes = require("./routes/inventoryHistoryRoutes");
const storeSettingRoutes = require("./routes/storeSettingRoutes");

// Create Express application
const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = (
  process.env.CLIENT_URL || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as server-to-server requests.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: "10kb" }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// Apply general rate limiter
app.use("/api", apiLimiter);

// Authentication rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

// Authentication routes
app.use("/api/auth", authLimiter, authRoutes);

// Product routes
app.use("/api/products", productRoutes);

// User routes
app.use("/api/users", userRoutes);

// Category routes
app.use("/api/categories", categoryRoutes);

// Cart routes
app.use("/api/cart", cartRoutes);

// Order routes
app.use("/api/orders", orderRoutes);

// Shipping routes
app.use("/api/shipping", shippingRoutes);

// Admin dashboard routes
app.use("/api/admin", adminDashboardRoutes);

// Admin customer management
app.use("/api/admin/customers", adminUserRoutes);

// Admin administrator management
app.use("/api/admin/administrators", adminManagementRoutes);

// Admin store settings
app.use("/api/admin/settings", storeSettingRoutes);

// Inventory history
app.use("/api/inventory/history", inventoryHistoryRoutes);

// Inventory management
app.use("/api/inventory", inventoryRoutes);

// Welcome route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the JBELLS Fashion E-Commerce API",
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    message: "Fashion E-Commerce API health check",
    database: databaseConnected ? "connected" : "disconnected",
    server: "running",
  });
});

// Handle unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || 500;

  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected server error occurred."
        : err.message,
  });
});

// Start server after database connection
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
      console.log("-----------------------------------");
      console.log("JBELLS Fashion E-Commerce API");
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("MongoDB connection established");
      console.log("-----------------------------------");
    });

    // Handle unexpected server errors
    server.on("error", (error) => {
      console.error("HTTP server error:", error.message);
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down server...`);

      server.close(async () => {
        try {
          await mongoose.connection.close();
          console.log("MongoDB connection closed.");
          process.exit(0);
        } catch (error) {
          console.error("Shutdown error:", error.message);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
