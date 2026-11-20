
const express = require("express");

const {
  getMyProfile,
  updateMyProfile,
  changePassword,
} = require("../controllers/userController");

const {
  getMyAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} = require("../controllers/addressController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All user routes require authentication.
router.use(protect);

// Customer profile routes.
router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.put("/me/change-password", changePassword);

// Customer delivery address routes.
router.get("/addresses", getMyAddresses);
router.post("/addresses", addAddress);
router.put("/addresses/:addressId", updateAddress);
router.patch("/addresses/:addressId/default", setDefaultAddress);
router.delete("/addresses/:addressId", deleteAddress);

module.exports = router;
