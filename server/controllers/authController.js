const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Waitlist = require('../models/Waitlist');

// Register a new user/vendor
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }
    
    // The "Email already registered" check is good and should stay
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    
    res.status(201).json({ success: true, message: 'Registration successful.' });
  } catch (err) {
    // NEW: Check for Mongoose Validation Errors
    if (err.name === 'ValidationError') {
      // Extract the first error message
      const message = Object.values(err.errors).map(val => val.message)[0];
      return res.status(400).json({ success: false, error: message });
    }
    // Fallback for other errors
    res.status(500).json({ success: false, error: err.message });
  }
};

// Login user/vendor
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    user.password = undefined;
    res.status(200).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get current user info
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.joinWaitlist = async (req, res) => {
  try {
    console.log('WAITLIST BODY:', req.body);
    const { name, email, phone, location, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ success: false, error: 'Name, email, and role are required.' });
    }
    // Prevent duplicate waitlist entry for same email and role
    const existing = await Waitlist.findOne({ email, role });
    if (existing) {
      // Treat duplicate as success
      return res.status(200).json({ success: true, data: existing });
    }
    const entry = await Waitlist.create({ name, email, phone, location, role });
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.checkWaitlist = async (req, res) => {
  try {
    const { email, role } = req.query;
    if (!email || !role) {
      return res.status(400).json({ joined: false, error: 'Email and role are required.' });
    }
    const entry = await Waitlist.findOne({ email, role });
    res.json({ joined: !!entry });
  } catch (err) {
    res.status(500).json({ joined: false, error: err.message });
  }
}; 