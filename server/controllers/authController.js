const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Waitlist = require('../models/Waitlist');
const sendEmail = require('../utils/sendEmail');

// Register a new user/vendor
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    // Password validation regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.'
      });
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

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found with this email.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP and expiry (10 minutes)
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const message = `
      <h1>Password Reset Request</h1>
      <p>Your OTP/Code for password reset is:</p>
      <h2>${otp}</h2>
      <p>This code is valid for 10 minutes.</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset OTP - ExpiryEaze',
        html: message,
      });

      res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, error: 'Email could not be sent' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Reset Password - Verify OTP and Set New Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    // Password validation regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.'
      });
    }

    // Find user by email and check if OTP is valid and not expired
    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordOtpExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid Email or OTP is invalid/expired' });
    }

    // Set new password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, data: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 