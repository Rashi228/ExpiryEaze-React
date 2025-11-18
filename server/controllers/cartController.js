const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

// SECURITY: Bulk purchase limits
const MAX_QUANTITY_PER_PRODUCT = 50; // Maximum quantity per product
const MAX_DAILY_PURCHASE_VALUE = 5000; // Maximum purchase value per day in dollars

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    
    // SECURITY: Get product to check vendor
    const product = await Product.findById(productId).populate('vendor');
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // SECURITY: Prevent vendors from purchasing their own products (fraud prevention)
    const user = await User.findById(userId);
    if (user && user.role === 'vendor') {
      const productVendorId = product.vendor._id ? product.vendor._id.toString() : product.vendor.toString();
      const userIdStr = userId.toString();
      
      if (productVendorId === userIdStr) {
        return res.status(403).json({ 
          success: false, 
          error: 'Vendors cannot purchase their own products. This prevents bulk buying fraud.' 
        });
      }
    }

    // SECURITY: Enforce maximum quantity per product
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }
    
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    let newQuantity = quantity;
    
    if (itemIndex > -1) {
      newQuantity = cart.items[itemIndex].quantity + quantity;
    }
    
    if (newQuantity > MAX_QUANTITY_PER_PRODUCT) {
      return res.status(400).json({ 
        success: false, 
        error: `Maximum quantity per product is ${MAX_QUANTITY_PER_PRODUCT}. You cannot add more than this to prevent bulk purchase fraud.` 
      });
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
    const productPrice = product.discountedPrice || product.price;
    const additionalCost = quantity * productPrice;
    
    if (todayTotal + additionalCost > MAX_DAILY_PURCHASE_VALUE) {
      return res.status(400).json({ 
        success: false, 
        error: `Daily purchase limit exceeded. Maximum daily purchase is $${MAX_DAILY_PURCHASE_VALUE}. This prevents bulk buying fraud.` 
      });
    }

    // Add to cart if all checks pass
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = newQuantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }
    
    await cart.save();
    res.status(200).json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get cart for user
exports.getCart = async (req, res) => {
  try {
    const { userId } = req.query;
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      populate: {
        path: 'vendor',
        model: 'User'
      }
    });
    res.status(200).json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { userId, itemId } = req.body;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, error: 'Cart not found' });
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();
    res.status(200).json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update item quantity in cart
exports.updateQuantity = async (req, res) => {
  try {
    const { userId, itemId, quantity } = req.body;
    console.log('🛒 Backend updateQuantity called:', { userId, itemId, quantity });
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      console.log('❌ Cart not found for user:', userId);
      return res.status(404).json({ success: false, error: 'Cart not found' });
    }
    
    console.log('📦 Cart items:', cart.items.map(item => ({ id: item._id.toString(), product: item.product.toString(), quantity: item.quantity })));
    
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    console.log('🔍 Item index found:', itemIndex);
    
    if (itemIndex === -1) {
      console.log('❌ Item not found in cart:', itemId);
      return res.status(404).json({ success: false, error: 'Item not found in cart' });
    }
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      console.log('🗑️ Removing item from cart');
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      console.log('📝 Updating quantity to:', quantity);
      cart.items[itemIndex].quantity = quantity;
    }
    
    await cart.save();
    console.log('✅ Cart saved successfully');
    res.status(200).json({ success: true, cart });
  } catch (err) {
    console.error('❌ Backend error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}; 