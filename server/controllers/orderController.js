const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// SECURITY: Bulk purchase limits
const MAX_QUANTITY_PER_PRODUCT = 50;
const MAX_DAILY_PURCHASE_VALUE = 5000;

// Place a new order
exports.placeOrder = async (req, res) => {
  try {
    const { userId, products, totalAmount, shippingAddress } = req.body;
    
    // SECURITY: Validate user is not a vendor trying to buy their own products
    const user = await User.findById(userId);
    if (user && user.role === 'vendor') {
      for (const orderProduct of products) {
        const product = await Product.findById(orderProduct.product).populate('vendor');
        if (product) {
          const productVendorId = product.vendor._id ? product.vendor._id.toString() : product.vendor.toString();
          if (productVendorId === userId.toString()) {
            return res.status(403).json({ 
              success: false, 
              error: 'Vendors cannot purchase their own products. This prevents bulk buying fraud.' 
            });
          }
        }
      }
    }

    // SECURITY: Check quantity limits
    for (const orderProduct of products) {
      if (orderProduct.quantity > MAX_QUANTITY_PER_PRODUCT) {
        return res.status(400).json({ 
          success: false, 
          error: `Maximum quantity per product is ${MAX_QUANTITY_PER_PRODUCT}. Order contains product with quantity ${orderProduct.quantity}.` 
        });
      }
    }

    // SECURITY: Check daily purchase limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayOrders = await Order.find({
      user: userId,
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    const todayTotal = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    if (todayTotal + totalAmount > MAX_DAILY_PURCHASE_VALUE) {
      return res.status(400).json({ 
        success: false, 
        error: `Daily purchase limit exceeded. Maximum daily purchase is $${MAX_DAILY_PURCHASE_VALUE}. You have already spent $${todayTotal.toFixed(2)} today.` 
      });
    }

    const order = new Order({
      user: userId,
      products,
      totalAmount,
      shippingAddress,
    });
    await order.save();
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all orders for a user
exports.getOrders = async (req, res) => {
  try {
    const { userId } = req.query;
    const orders = await Order.find({ user: userId }).populate('products.product');
    res.status(200).json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 