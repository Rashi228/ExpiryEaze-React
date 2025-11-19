const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorProducts,
} = require('../controllers/productController');
const { medicineAuth } = require('../controllers/vendorController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(authMiddleware, createProduct);

// Get vendor's own products (needs to be before /:id route)
router.route('/vendor')
  .get(authMiddleware, getVendorProducts);

router.route('/:id')
  .get(getProductById)
  .put(authMiddleware, updateProduct)
  .delete(authMiddleware, deleteProduct);

// Medicine authentication route
router.post('/../vendors/medicine-auth', medicineAuth);

module.exports = router;