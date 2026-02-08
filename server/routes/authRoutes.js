const express = require("express");
const {
  register,
  login,
  getMe,
  joinWaitlist,
  checkWaitlist,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const vendorController = require("../controllers/vendorController");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.post("/waitlist", joinWaitlist);
router.get("/waitlist/check", checkWaitlist);

// Password Reset
router.post("/forgotpassword", forgotPassword);
router.post("/resetpassword", resetPassword);

// Vendor profile routes
router.get("/vendors/profile", authMiddleware, vendorController.getProfile);
router.put("/vendors/profile", authMiddleware, vendorController.updateProfile);

module.exports = router;
