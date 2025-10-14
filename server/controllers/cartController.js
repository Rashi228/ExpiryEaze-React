const Cart = require('../models/Cart');

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
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