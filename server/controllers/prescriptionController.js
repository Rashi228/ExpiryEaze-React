const Prescription = require('../models/Prescription');
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/prescriptions/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg, .jpeg and .pdf format allowed!'));
  }
});

// @desc    Upload prescription
// @route   POST /api/v1/prescriptions
// @access  Private (User)
exports.uploadPrescription = async (req, res) => {
  try {
    const {
      product,
      patientName,
      patientAge,
      patientGender,
      reasonForPurchase,
      medicalCondition,
      doctorName,
      doctorPhone,
      hospitalClinicName,
      contactNumber,
      emergencyContact,
    } = req.body;

    // Validate required fields
    if (!product || !patientName || !patientAge || !patientGender || !reasonForPurchase || !medicalCondition || !contactNumber) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields',
      });
    }

    // Check if product exists and requires prescription
    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    if (!productDoc.requiresPrescription) {
      return res.status(400).json({
        success: false,
        error: 'This product does not require a prescription',
      });
    }

    // Get file paths from uploaded files
    const prescriptionDocuments = req.files['prescriptionDocuments']
      ? req.files['prescriptionDocuments'].map(file => `/uploads/prescriptions/${file.filename}`)
      : [];
    
    const medicalReports = req.files['medicalReports']
      ? req.files['medicalReports'].map(file => `/uploads/prescriptions/${file.filename}`)
      : [];

    if (prescriptionDocuments.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one prescription document is required',
      });
    }

    // Create prescription
    const prescription = await Prescription.create({
      user: req.user.id,
      product,
      patientName,
      patientAge,
      patientGender,
      reasonForPurchase,
      medicalCondition,
      doctorName,
      doctorPhone,
      hospitalClinicName,
      contactNumber,
      emergencyContact,
      prescriptionDocuments,
      medicalReports,
      verificationStatus: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Prescription uploaded successfully. It will be reviewed by our medical team.',
      data: prescription,
    });
  } catch (err) {
    console.error('Upload prescription error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to upload prescription',
    });
  }
};

// @desc    Get user's prescriptions
// @route   GET /api/v1/prescriptions/my-prescriptions
// @access  Private (User)
exports.getUserPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ user: req.user.id })
      .populate('product', 'name category')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// @desc    Get all prescriptions (Admin/Doctor)
// @route   GET /api/v1/prescriptions
// @access  Private (Admin)
exports.getAllPrescriptions = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.verificationStatus = status;
    }

    const prescriptions = await Prescription.find(query)
      .populate('user', 'name email phone')
      .populate('product', 'name category')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// @desc    Get single prescription
// @route   GET /api/v1/prescriptions/:id
// @access  Private
exports.getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('product', 'name category description');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found',
      });
    }

    // Check if user owns this prescription
    if (prescription.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this prescription',
      });
    }

    res.status(200).json({
      success: true,
      data: prescription,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// @desc    Update prescription status (Admin/Doctor)
// @route   PUT /api/v1/prescriptions/:id/status
// @access  Private (Admin)
exports.updatePrescriptionStatus = async (req, res) => {
  try {
    const { verificationStatus, reviewNotes, reviewedBy } = req.body;

    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found',
      });
    }

    prescription.verificationStatus = verificationStatus;
    prescription.reviewNotes = reviewNotes;
    prescription.reviewedBy = reviewedBy;
    prescription.reviewedAt = Date.now();

    await prescription.save();

    res.status(200).json({
      success: true,
      message: 'Prescription status updated successfully',
      data: prescription,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Export multer upload middleware
exports.uploadFiles = upload.fields([
  { name: 'prescriptionDocuments', maxCount: 5 },
  { name: 'medicalReports', maxCount: 5 }
]);

