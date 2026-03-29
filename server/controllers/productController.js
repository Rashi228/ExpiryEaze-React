const Product = require('../models/Product');


// @desc     Get FatSecret Data for missing ingredients
// @route    GET /api/v1/products/fatsecret/:barcode
// @access   Public/Private
  

// @desc     Get all products
// @route    GET /api/v1/products
// @access   Public
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().populate('vendor', 'name');
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc     Get single product by ID
// @route    GET /api/v1/products/:id
// @access   Public
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('vendor', 'name');
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc     Create new product
// @route    POST /api/v1/products
// @access   Private (for vendors)
exports.createProduct = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing user context.',
      });
    }

    // SECURITY: Validate expiry date is not in the past
    if (req.body.expiryDate) {
      const expiryDate = new Date(req.body.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (expiryDate < today) {
        return res.status(400).json({ 
          success: false, 
          error: 'Expiry date cannot be in the past.' 
        });
      }
    }

    // SECURITY: Ensure vendor field matches authenticated user
    if (req.body.vendor && req.body.vendor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized: You can only create products for yourself.' 
      });
    }

    // Set vendor to authenticated user (override any client-provided vendor)
    req.body.vendor = req.user.id;

    const product = await Product.create(req.body);
    
    // TODO: Add audit log entry here when audit system is implemented

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc     Update a product
// @route    PUT /api/v1/products/:id
// @access   Private (for vendors)
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // SECURITY: Verify vendor owns this product
    const productVendorId = product.vendor.toString();
    const requestVendorId = req.user.id.toString();
    
    if (productVendorId !== requestVendorId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized: You can only update your own products.' 
      });
    }

    // SECURITY: Prevent expiry date from being extended backwards (fraud prevention)
    if (req.body.expiryDate) {
      const newExpiryDate = new Date(req.body.expiryDate);
      const oldExpiryDate = new Date(product.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (newExpiryDate < today) {
        return res.status(400).json({ 
          success: false, 
          error: 'Expiry date cannot be in the past.' 
        });
      }
      
      if (newExpiryDate > oldExpiryDate) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot extend expiry date. You can only set it to an earlier date or keep it the same. This prevents fraud.' 
        });
      }
    }

    // SECURITY: Prevent expiry photo from being changed (immutable after first upload)
    if (req.body.expiryPhoto && product.expiryPhoto && req.body.expiryPhoto !== product.expiryPhoto) {
      return res.status(400).json({ 
        success: false, 
        error: 'Expiry photo cannot be changed once uploaded. Contact admin if you need to update it.' 
      });
    }

    // Manually update fields
    product.name = req.body.name || product.name;
    product.description = req.body.description || product.description;
    product.price = req.body.price || product.price;
    product.category = req.body.category || product.category;
    product.stock = req.body.stock || product.stock;
    
    if (req.body.expiryDate) {
      product.expiryDate = req.body.expiryDate;
    }
    
    product.images = req.body.images || product.images;
    
    if (req.body.expiryPhoto && !product.expiryPhoto) {
      product.expiryPhoto = req.body.expiryPhoto;
    }
    
    if ('discountedPrice' in req.body) {
       product.discountedPrice = req.body.discountedPrice;
    }

    // If a barcode was provided during update, save it
    if (req.body.barcode) {
      product.barcode = req.body.barcode;
    }
    // Same for ingredients and netWeight
    if (req.body.ingredients) {
      product.ingredients = req.body.ingredients;
    }
    if (req.body.netWeight) {
      product.netWeight = req.body.netWeight;
    }

    const updatedProduct = await product.save();

    // TODO: Add audit log entry here when audit system is implemented

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc     Get vendor's own products
// @route    GET /api/v1/products/vendor
// @access   Private (for vendors)
exports.getVendorProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ vendor: req.user.id }).populate('vendor', 'name');
    res.status(200).json({ success: true, count: products.length, products: products });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc     Delete a product
// @route    DELETE /api/v1/products/:id
// @access   Private (for vendors)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // SECURITY: Verify vendor owns this product
    const productVendorId = product.vendor.toString();
    const requestVendorId = req.user.id.toString();
    
    if (productVendorId !== requestVendorId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized: You can only delete your own products.' 
      });
    }

    await Product.findByIdAndDelete(req.params.id);
    
    // TODO: Add audit log entry here when audit system is implemented

    res.status(200).json({ success: true, data: {}});
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}; 

// =========================================================================
// NEW: THE "MONGODB MEMORY" SCANNER FUNCTION
// =========================================================================

// @desc      Get single product by barcode (For Scanner Autofill)
// @route     GET /api/v1/products/barcode/:barcode
// @access    Public or Private (Vendor)
exports.getProductByBarcode = async (req, res, next) => {
  try {
    // Search our MongoDB to see if ANY vendor has ever scanned this barcode before
    const product = await Product.findOne({ barcode: req.params.barcode });
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found in local database' });
    }
    
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};