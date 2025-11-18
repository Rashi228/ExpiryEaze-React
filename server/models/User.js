const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    trim: true,
    // STRICT REGEX: Requires first name + last name (at least 2 words, each min 2 characters)
    match: [/^[A-Za-z]{2,}(\s+[A-Za-z]{2,})+$/, "Name must include first name and last name (at least 2 words, each with minimum 2 letters)."],
    minlength: [5, "Name must be at least 5 characters long (e.g., 'John Doe')"]
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    lowercase: true,
    trim: true,
    // STRICT REGEX: Requires proper domain with TLD (e.g., example.com, not just example)
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
      "Please add a valid email address with proper domain (e.g., user@example.com)",
    ],
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: [8, "Password must be at least 8 characters long"],
    // Enforce: 1 lowercase, 1 uppercase, 1 number, 1 special character
    match: [
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character."
    ],
    select: false, // Do not return password by default
  },
  role: {
    type: String,
    enum: ["user", "vendor"],
    default: "user",
  },
  address: {
    type: String,
  },
  phone: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: false,
  },
  aadhar: {
    type: String,
    required: false,
  },
  profileImage: {
    type: String,
    required: false,
  },
  profileCompleted: {
    type: Boolean,
    default: false,
  },
  isVendor: {
    type: Boolean,
    default: false,
  },
  // Medicine authentication fields
  isMedicineVerified: {
    type: Boolean,
    default: false,
  },
  pharmacyLicenseNumber: {
    type: String,
  },
  businessName: {
    type: String,
  },
  documentUrl: {
    type: String,
  },
  // Rating and review fields for vendors
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  ratingDistribution: {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual for profile completion percentage
UserSchema.virtual("profileCompletion").get(function () {
  let completed = 0;
  const requiredFields = [
    this.name,
    this.email,
    this.phone,
    this.location,
    this.aadhar,
    this.profileImage,
  ];
  requiredFields.forEach((f) => {
    if (f) completed += 1;
  });
  return Math.round((completed / requiredFields.length) * 100);
});

module.exports = mongoose.model("User", UserSchema);
