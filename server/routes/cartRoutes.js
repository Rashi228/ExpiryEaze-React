const express = require('express');
const { addToCart, getCart, removeFromCart, updateQuantity } = require('../controllers/cartController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, addToCart);
router.get('/', authMiddleware, getCart);
router.delete('/', authMiddleware, removeFromCart);
router.put('/', authMiddleware, updateQuantity);

module.exports = router;