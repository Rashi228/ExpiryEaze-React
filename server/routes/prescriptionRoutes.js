const express = require('express');
const router = express.Router();
const {
  uploadPrescription,
  getUserPrescriptions,
  getAllPrescriptions,
  getPrescription,
  updatePrescriptionStatus,
  uploadFiles,
} = require('../controllers/prescriptionController');
const { authMiddleware } = require('../middleware/authMiddleware');

// User routes
router.post('/', authMiddleware, uploadFiles, uploadPrescription);
router.get('/my-prescriptions', authMiddleware, getUserPrescriptions);
router.get('/:id', authMiddleware, getPrescription);

// Admin routes
router.get('/', authMiddleware, getAllPrescriptions);
router.put('/:id/status', authMiddleware, updatePrescriptionStatus);

module.exports = router;

