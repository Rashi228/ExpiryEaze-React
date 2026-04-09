const User = require('../models/User');
const MedicineVerification = require('../models/MedicineVerification');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc      Get all medicine verifications (with optional status filter)
// @route     GET /api/v1/admin/medicine-verifications
// @access    Private (Admin only)
exports.getMedicineVerifications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const verifications = await MedicineVerification.find(filter)
      .populate('vendor', 'name email phone location aadhar profileImage')
      .sort('-submittedAt');

    res.status(200).json({
      success: true,
      count: verifications.length,
      data: verifications
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Approve a medicine verification application
// @route     PUT /api/v1/admin/medicine-verifications/:id/approve
// @access    Private (Admin only)
exports.approveMedicineVerification = async (req, res) => {
  try {
    const verification = await MedicineVerification.findById(req.params.id);

    if (!verification) {
      return res.status(404).json({ success: false, error: 'Verification application not found' });
    }

    if (verification.status === 'approved') {
      return res.status(400).json({ success: false, error: 'This application is already approved' });
    }

    // Update the verification record
    verification.status = 'approved';
    verification.reviewedAt = Date.now();
    await verification.save();

    // Update the vendor's User profile
    const vendor = await User.findById(verification.vendor);
    if (vendor) {
      vendor.isMedicineVerified = true;
      vendor.pharmacyLicenseNumber = verification.licenseNumber;
      vendor.businessName = verification.businessName;
      await vendor.save();
    }

    res.status(200).json({
      success: true,
      message: 'Application approved successfully',
      data: verification
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Reject a medicine verification application
// @route     PUT /api/v1/admin/medicine-verifications/:id/reject
// @access    Private (Admin only)
exports.rejectMedicineVerification = async (req, res) => {
  try {
    const { reviewNotes } = req.body;
    const verification = await MedicineVerification.findById(req.params.id);

    if (!verification) {
      return res.status(404).json({ success: false, error: 'Verification application not found' });
    }

    if (verification.status === 'rejected') {
      return res.status(400).json({ success: false, error: 'This application is already rejected' });
    }

    // Update the verification record
    verification.status = 'rejected';
    verification.reviewNotes = reviewNotes || 'Rejected by administrator.';
    verification.reviewedAt = Date.now();
    await verification.save();

    // Update the vendor's User profile (if it was previously approved)
    const vendor = await User.findById(verification.vendor);
    if (vendor) {
      vendor.isMedicineVerified = false;
      await vendor.save();
    }

    res.status(200).json({
      success: true,
      message: 'Application rejected',
      data: verification
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Get basic dashboard stats
// @route     GET /api/v1/admin/stats
// @access    Private (Admin only)
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalVendors = await User.countDocuments({ role: 'vendor' });
    const pendingVerifications = await MedicineVerification.countDocuments({ status: 'pending' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Calculate total revenue from all orders
    const revenueData = await Order.aggregate([
      { $match: { status: { $in: ['Delivered', 'Shipped', 'Pending'] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Aggregate Orders by Status for Bar Chart
    const ordersByStatusRaw = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    // Format to a clean object
    const ordersByStatus = ordersByStatusRaw.reduce((acc, curr) => {
      acc[curr._id || 'Unknown'] = curr.count;
      return acc;
    }, { Pending: 0, Shipped: 0, Delivered: 0, Cancelled: 0 });

    // Aggregate Products by Category for Doughnut Chart
    const productsByCategoryRaw = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    const productsByCategory = productsByCategoryRaw.reduce((acc, curr) => {
      acc[curr._id || 'Uncategorized'] = curr.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalVendors,
        pendingVerifications,
        totalProducts,
        totalOrders,
        totalRevenue,
        ordersByStatus,
        productsByCategory
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Get all global orders
// @route     GET /api/v1/admin/orders
// @access    Private (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email profileImage')
      .populate('products.product', 'name category expiryDate')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Update an order status
// @route     PUT /api/v1/admin/orders/:id/status
// @access    Private (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Ensure valid status
    const validStatuses = ['Pending', 'Pending Prescription', 'In Progress', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status provided' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
