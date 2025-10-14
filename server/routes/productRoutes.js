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
  .post(createProduct);

// Get vendor's own products (needs to be before /:id route)
router.route('/vendor')
  .get(authMiddleware, getVendorProducts);

router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

// Medicine authentication route
router.post('/../vendors/medicine-auth', medicineAuth);

module.exports = router;