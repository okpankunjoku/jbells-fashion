
const User = require("../models/User");

// Get the logged-in customer's saved addresses.
const getMyAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found or inactive.",
      });
    }

    return res.status(200).json({
      success: true,
      count: user.addresses.length,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve saved addresses.",
    });
  }
};

// Add a new delivery address.
const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found or inactive.",
      });
    }

    if (user.addresses.length >= 10) {
      return res.status(400).json({
        success: false,
        message: "You can save a maximum of 10 delivery addresses.",
      });
    }

    const {
      fullName,
      phone,
      address,
      city,
      state,
      postalCode,
      deliveryInstructions,
      isDefault,
    } = req.body;

    const requiredFields = {
      fullName,
      phone,
      address,
      city,
      state,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (typeof value !== "string" || !value.trim()) {
        return res.status(400).json({
          success: false,
          message: `${field} is required.`,
        });
      }
    }

    if (
      typeof postalCode !== "undefined" &&
      typeof postalCode !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Postal code must be text.",
      });
    }

    if (
      typeof deliveryInstructions !== "undefined" &&
      typeof deliveryInstructions !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Delivery instructions must be text.",
      });
    }

    const makeDefault =
      user.addresses.length === 0 || isDefault === true;

    if (makeDefault) {
      user.addresses.forEach((savedAddress) => {
        savedAddress.isDefault = false;
      });
    }

    user.addresses.push({
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode?.trim() || "",
      deliveryInstructions: deliveryInstructions?.trim() || "",
      isDefault: makeDefault,
    });

    await user.save();

    const newAddress = user.addresses[user.addresses.length - 1];

    return res.status(201).json({
      success: true,
      message: "Delivery address saved successfully.",
      address: newAddress,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Add address error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save delivery address.",
    });
  }
};

// Update an existing delivery address.
const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found or inactive.",
      });
    }

    const savedAddress = user.addresses.id(req.params.addressId);

    if (!savedAddress) {
      return res.status(404).json({
        success: false,
        message: "Delivery address not found.",
      });
    }

    const allowedFields = [
      "fullName",
      "phone",
      "address",
      "city",
      "state",
      "postalCode",
      "deliveryInstructions",
    ];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (typeof req.body[field] !== "string") {
          return res.status(400).json({
            success: false,
            message: `${field} must be text.`,
          });
        }

        const value = req.body[field].trim();

        if (
          ["fullName", "phone", "address", "city", "state"].includes(field) &&
          !value
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} is required.`,
          });
        }

        savedAddress[field] = value;
      }
    }

    if (req.body.isDefault === true) {
      user.addresses.forEach((item) => {
        item.isDefault = false;
      });

      savedAddress.isDefault = true;
    } else if (req.body.isDefault === false && savedAddress.isDefault) {
      return res.status(400).json({
        success: false,
        message: "Choose another default address before removing this one as default.",
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Delivery address updated successfully.",
      address: savedAddress,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Update address error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update delivery address.",
    });
  }
};

// Make an address the customer's default delivery address.
const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found or inactive.",
      });
    }

    const selectedAddress = user.addresses.id(req.params.addressId);

    if (!selectedAddress) {
      return res.status(404).json({
        success: false,
        message: "Delivery address not found.",
      });
    }

    user.addresses.forEach((item) => {
      item.isDefault = item._id.equals(selectedAddress._id);
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Default delivery address updated successfully.",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Set default address error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update default delivery address.",
    });
  }
};

// Delete a saved delivery address.
const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found or inactive.",
      });
    }

    const savedAddress = user.addresses.id(req.params.addressId);

    if (!savedAddress) {
      return res.status(404).json({
        success: false,
        message: "Delivery address not found.",
      });
    }

    const wasDefault = savedAddress.isDefault;

    savedAddress.deleteOne();

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Delivery address deleted successfully.",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Delete address error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete delivery address.",
    });
  }
};

module.exports = {
  getMyAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};
