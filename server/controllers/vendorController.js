const User = require("../models/User");
const Product = require('../models/Product');
const MedicineVerification = require('../models/MedicineVerification');

// @desc      Handle medicine authentication for vendors
// @route     POST /api/v1/vendors/medicine-auth
// @access    Private (for vendors)
exports.medicineAuth = async (req, res) => {
  try {
    const { pharmacyLicenseNumber, businessName, documentUrl } = req.body;
    if (!pharmacyLicenseNumber || !businessName) {
      return res
        .status(400)
        .json({
          success: false,
          error: "All required fields must be provided.",
        });
    }
    const vendor = await User.findById(req.user.id);
    if (!vendor || vendor.role !== "vendor") {
      return res
        .status(404)
        .json({ success: false, error: "Vendor not found." });
    }
    vendor.isMedicineVerified = true;
    vendor.pharmacyLicenseNumber = pharmacyLicenseNumber;
    vendor.businessName = businessName;
    vendor.documentUrl = documentUrl || "";
    await vendor.save();
    res
      .status(200)
      .json({
        success: true,
        message: "Vendor medicine authentication successful.",
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Get current vendor profile
// @route     GET /api/v1/vendors/profile
// @access    Private (for vendors)
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user || user.role !== "vendor") {
      return res
        .status(404)
        .json({ success: false, error: "Vendor not found." });
    }
    res.status(200).json({ success: true, profile: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Update vendor profile
// @route     PUT /api/v1/vendors/profile
// @access    Private (for vendors)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found. Please log in again." });
    }
    user.role = 'vendor'; // Always set role to vendor
    const { name, phone, location, aadhar, email, profileImage } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (location) user.location = location;
    if (aadhar) user.aadhar = aadhar;
    if (email) user.email = email;
    if (profileImage) user.profileImage = profileImage;
    user.profileCompleted = !!(
      user.name &&
      user.email &&
      user.phone &&
      user.location &&
      user.aadhar
    );
    await user.save();
    res.status(200).json({ success: true, profile: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Get all vendors with their products
// @route     GET /api/v1/vendors/all-with-products
// @access    Public
exports.getAllVendorsWithProducts = async (req, res) => {
  try {
    // Find all users with role 'vendor'
    const vendors = await User.find({ role: 'vendor' }).select('-password');
    // For each vendor, get their products
    const vendorsWithProducts = await Promise.all(
      vendors.map(async (vendor) => {
        const products = await Product.find({ vendor: vendor._id });
        return {
          vendor,
          products,
        };
      })
    );
    res.status(200).json({ success: true, data: vendorsWithProducts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Check medicine verification status
// @route     GET /api/v1/vendors/medicine-verification-status
// @access    Private (for vendors)
exports.getMedicineVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user || user.role !== "vendor") {
      return res
        .status(404)
        .json({ success: false, error: "Vendor not found." });
    }

    // Check if vendor is verified for medicine sales
    const isVerified = user.isMedicineVerified === true;

    res.status(200).json({
      success: true,
      isVerified: isVerified,
      message: isVerified ? "Vendor is verified for medicine sales" : "Vendor needs verification for medicine sales"
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  }
};

// @desc      Submit medicine vendor verification form
// @route     POST /api/v1/vendors/verify
// @access    Private (for vendors)
exports.submitVerification = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const user = await User.findById(vendorId);
    
    if (!user || user.role !== "vendor") {
      return res.status(404).json({ success: false, error: "Vendor not found." });
    }

    // Check if a pending or approved verification already exists
    const existing = await MedicineVerification.findOne({
      vendor: vendorId,
      status: { $in: ["pending", "approved"] }
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: "You already have a pending or approved verification application." 
      });
    }

    const {
      businessName, licenseNumber, pharmacyLicense, businessAddress,
      contactPerson, phoneNumber, email, businessType, yearsInBusiness
    } = req.body;

    // Strict Validation
    const requiredFields = [
      'businessName', 'licenseNumber', 'pharmacyLicense', 'businessAddress',
      'contactPerson', 'phoneNumber', 'email', 'businessType', 'yearsInBusiness'
    ];

    for (const field of requiredFields) {
      if (!req.body[field] || String(req.body[field]).trim().length < 2) {
        return res.status(400).json({ 
          success: false, 
          error: `Field '${field.replace(/([A-Z])/g, ' $1').toLowerCase()}' is required and must be at least 2 characters.` 
        });
      }
    }

    // Regex Validation for Email & Phone (Indian context for phone: 10 digits starting with 6-9)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: "Please provide a valid email address." });
    }
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ success: false, error: "Please provide a valid 10-digit phone number." });
    }

    const verificationPayload = {
      ...req.body,
      vendor: vendorId,
      status: "pending"
    };

    const verification = new MedicineVerification(verificationPayload);
    await verification.save();

    res.status(201).json({
      success: true,
      message: "Verification application submitted successfully.",
      data: verification
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "An unexpected error occurred while submitting your application." });
  }
};
