const Product = require('../models/Product');

// @desc      Get all products
// @route     GET /api/v1/products
// @access    Public
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().populate('vendor', 'name');
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc      Get single product
// @route     GET /api/v1/products/:id
// @access    Public
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

// @desc      Create new product
// @route     POST /api/v1/products
// @access    Private (for vendors)
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc      Update a product
// @route     PUT /api/v1/products/:id
// @access    Private (for vendors)
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Manually update fields
    product.name = req.body.name || product.name;
    product.description = req.body.description || product.description;
    product.price = req.body.price || product.price;
    product.category = req.body.category || product.category;
    product.stock = req.body.stock || product.stock;
    product.expiryDate = req.body.expiryDate || product.expiryDate;
    product.images = req.body.images || product.images;
    product.expiryPhoto = req.body.expiryPhoto || product.expiryPhoto;
    
    // Explicitly handle discountedPrice to allow setting it to null/undefined
    if ('discountedPrice' in req.body) {
       product.discountedPrice = req.body.discountedPrice;
    }

    const updatedProduct = await product.save();

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc      Get vendor's own products
// @route     GET /api/v1/products/vendor
// @access    Private (for vendors)
exports.getVendorProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ vendor: req.user.id }).populate('vendor', 'name');
    res.status(200).json({ success: true, count: products.length, products: products });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc      Delete a product
// @route     DELETE /api/v1/products/:id
// @access    Private (for vendors)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.status(200).json({ success: true, data: {}});
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}; 