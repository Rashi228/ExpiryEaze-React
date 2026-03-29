const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorProducts// <-- Moved this up here!
} = require('../controllers/productController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Note: I removed the medicineAuth import. You should move that route into your vendorRoutes.js file!

const router = express.Router();

// 1. Custom Routes First

// 2. Vendor Specific Routes
router.route('/vendor')
  .get(authMiddleware, getVendorProducts);

// 3. General Routes
router.route('/')
  .get(getProducts)
  .post(authMiddleware, createProduct);

// 4. ID Routes Last (The Catch-All)
router.route('/:id')
  .get(getProductById)
  .put(authMiddleware, updateProduct)
  .delete(authMiddleware, deleteProduct);

module.exports = router;