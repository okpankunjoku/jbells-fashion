
const StoreSetting = require("../models/StoreSetting");

const DEFAULT_SETTINGS = {
  settingsKey: "jbells-store",
  storeName: "JBELLS",
  contactEmail: "",
  contactPhone: "",
  businessAddress: "",
  currency: "NGN",
  country: "Nigeria",
  deliveryCountry: "Nigeria",
  paymentMethods: ["pay_on_delivery"],
  notifications: {
    newOrderEmail: true,
    lowStockEmail: true,
    orderStatusEmail: true,
  },
};

// GET /api/admin/settings
const getStoreSettings = async (req, res) => {
  try {
    let settings = await StoreSetting.findOne({
      settingsKey: "jbells-store",
    });

    if (!settings) {
      settings = await StoreSetting.create({
        ...DEFAULT_SETTINGS,
        updatedBy: req.user._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Store settings retrieved successfully.",
      settings,
    });
  } catch (error) {
    console.error("Get store settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve store settings.",
      error: process.env.NODE_ENV === "development"
        ? error.message
        : undefined,
    });
  }
};

// PUT /api/admin/settings
const updateStoreSettings = async (req, res) => {
  try {
    const {
      storeName,
      contactEmail,
      contactPhone,
      businessAddress,
      notifications,
    } = req.body;

    if (
      typeof storeName !== "string" ||
      !storeName.trim() ||
      storeName.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid store name (maximum 100 characters).",
      });
    }

    const normalizedEmail =
      typeof contactEmail === "string"
        ? contactEmail.trim().toLowerCase()
        : "";

    // Correct email validation expression.
    if (
      normalizedEmail &&
      (
        normalizedEmail.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid store contact email address.",
      });
    }

    if (
      typeof contactPhone !== "string" ||
      contactPhone.trim().length > 25
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid contact phone number.",
      });
    }

    if (
      typeof businessAddress !== "string" ||
      businessAddress.trim().length > 300
    ) {
      return res.status(400).json({
        success: false,
        message: "Business address cannot exceed 300 characters.",
      });
    }

    const notificationSettings = {};

    if (notifications !== undefined) {
      if (
        !notifications ||
        typeof notifications !== "object" ||
        Array.isArray(notifications)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid notification settings.",
        });
      }

      const allowedKeys = [
        "newOrderEmail",
        "lowStockEmail",
        "orderStatusEmail",
      ];

      for (const key of allowedKeys) {
        if (
          notifications[key] !== undefined &&
          typeof notifications[key] !== "boolean"
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid value for ${key}.`,
          });
        }

        if (notifications[key] !== undefined) {
          notificationSettings[`notifications.${key}`] =
            notifications[key];
        }
      }
    }

    const update = {
      storeName: storeName.trim(),
      contactEmail: normalizedEmail,
      contactPhone: contactPhone.trim(),
      businessAddress: businessAddress.trim(),
      updatedBy: req.user._id,

      // Fixed JBELLS business settings.
      currency: "NGN",
      country: "Nigeria",
      deliveryCountry: "Nigeria",
      paymentMethods: ["pay_on_delivery"],

      ...notificationSettings,
    };

    const settings = await StoreSetting.findOneAndUpdate(
      { settingsKey: "jbells-store" },
      {
        $set: update,
        $setOnInsert: {
          settingsKey: "jbells-store",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "JBELLS store settings updated successfully.",
      settings,
    });
  } catch (error) {
    console.error("Update store settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update store settings.",
      error: process.env.NODE_ENV === "development"
        ? error.message
        : undefined,
    });
  }
};

module.exports = {
  getStoreSettings,
  updateStoreSettings,
};
