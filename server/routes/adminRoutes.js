const express = require('express');
const router = express.Router();
const { authMiddleware, adminRoleMiddleware } = require('../middleware/authMiddleware');
const {
  getMedicineVerifications,
  approveMedicineVerification,
  rejectMedicineVerification,
  getAdminStats,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/adminController');

// All admin routes must be protected by auth and admin role
router.use(authMiddleware, adminRoleMiddleware);

router.get('/stats', getAdminStats);
router.get('/medicine-verifications', getMedicineVerifications);
router.put('/medicine-verifications/:id/approve', approveMedicineVerification);
router.put('/medicine-verifications/:id/reject', rejectMedicineVerification);

router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

module.exports = router;
