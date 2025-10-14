const express = require('express');
const { addToCart, getCart, removeFromCart, updateQuantity } = require('../controllers/cartController');
const router = express.Router();

router.post('/', addToCart);
router.get('/', getCart);
router.delete('/', removeFromCart);
router.put('/', updateQuantity);

module.exports = router; 