const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
  },
  discountedPrice: {
    type: Number,
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
  },
  requiresPrescription: {
    type: Boolean,
    default: false,
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please add an expiry date'],
  },
  stock: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    default: 0,
  },
  imageUrl: {
    type: String,
    default: 'no-photo.jpg',
  },
  images: [{
    type: String,
  }],
  expiryPhoto: {
    type: String,
  },
  vendor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', ProductSchema); 