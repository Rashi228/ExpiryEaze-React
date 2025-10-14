const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
  },
  order: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order',
  },
  // Patient Information
  patientName: {
    type: String,
    required: [true, 'Please add patient name'],
  },
  patientAge: {
    type: Number,
    required: [true, 'Please add patient age'],
  },
  patientGender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Please add patient gender'],
  },
  // Medical Information
  reasonForPurchase: {
    type: String,
    required: [true, 'Please provide reason for purchase'],
  },
  medicalCondition: {
    type: String,
    required: [true, 'Please describe medical condition'],
  },
  doctorName: {
    type: String,
  },
  doctorPhone: {
    type: String,
  },
  hospitalClinicName: {
    type: String,
  },
  // Document Uploads
  prescriptionDocuments: [{
    type: String, // URLs to uploaded documents
  }],
  medicalReports: [{
    type: String, // URLs to uploaded medical reports
  }],
  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_clarification'],
    default: 'pending',
  },
  reviewedBy: {
    type: String, // Doctor/Admin who reviewed
  },
  reviewNotes: {
    type: String,
  },
  reviewedAt: {
    type: Date,
  },
  // Contact Information
  contactNumber: {
    type: String,
    required: [true, 'Please provide contact number'],
  },
  emergencyContact: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);

