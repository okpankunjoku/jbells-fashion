
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

// ========================================
// CORS CONFIGURATION
// ========================================

// Add your deployed frontend domains and local development URL.
// CLIENT_URL on Render can also contain multiple comma-separated origins.

const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",

  // JBELLS Vercel production domains
  "https://jbells-fashion.vercel.app",
  "https://jbells-fashion-t28s.vercel.app",

  // Additional origins configured on Render
  ...configuredOrigins,
]);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header.
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, "");

    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn("CORS blocked origin:", origin);

    return callback(new Error("Origin not allowed by CORS"));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
  ],

  optionsSuccessStatus: 204,
};

// Apply CORS before security middleware and API routes.
// This also handles browser OPTIONS preflight requests.
app.use(cors(corsOptions));

// Security headers
app.use(helmet());

// ========================================
// REQUEST BODY PARSING
// ========================================

app.use(express.json({ limit: "10kb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
  })
);

// ========================================
// RATE LIMITING
// ========================================

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

// ========================================
// API ROUTES
// ========================================

app.use("/api/auth", authLimiter, authRoutes);

app.use("/api/products", productRoutes);

app.use("/api/users", userRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/shipping", shippingRoutes);

app.use("/api/admin", adminDashboardRoutes);

app.use("/api/admin/customers", adminUserRoutes);

app.use("/api/admin/administrators", adminManagementRoutes);

app.use("/api/admin/settings", storeSettingRoutes);

app.use("/api/inventory/history", inventoryHistoryRoutes);

app.use("/api/inventory", inventoryRoutes);

// ========================================
// WELCOME ROUTE
// ========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the JBELLS Fashion E-Commerce API",
  });
});

// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    message: "Fashion E-Commerce API health check",
    database: databaseConnected ? "connected" : "disconnected",
    server: "running",
  });
});

// ========================================
// UNKNOWN API ROUTES
// ========================================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

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

// ========================================
// START SERVER AFTER DATABASE CONNECTION
// ========================================

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
      console.log("Allowed frontend origins:");

      allowedOrigins.forEach((origin) => {
        console.log(`- ${origin}`);
      });

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
