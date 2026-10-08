const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Supports students, employees, and general users
 * Includes geospatial indexing for location-based features
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^[+]?[\d\s\-()]{7,15}$/, 'Please enter a valid phone number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password by default
    },
    userType: {
      type: String,
      enum: ['student', 'employee', 'general'],
      default: 'general',
    },

    // Student-specific information
    studentInfo: {
      college: { type: String, trim: true },
      collegeId: { type: String, trim: true },
      collegeEmail: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid college email'],
      },
    },

    // Employee-specific information
    employeeInfo: {
      company: { type: String, trim: true },
      workEmail: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid work email'],
      },
      employeeId: { type: String, trim: true },
    },

    profilePhoto: {
      type: String,
      default: null,
    },

    // Verification statuses
    verification: {
      emailVerified: { type: Boolean, default: false },
      phoneVerified: { type: Boolean, default: false },
      identityVerified: { type: Boolean, default: false },
      studentVerified: { type: Boolean, default: false },
      employeeVerified: { type: Boolean, default: false },
    },

    // OTP for email/phone verification
    otp: {
      code: { type: String, select: false },
      expiresAt: { type: Date, select: false },
    },

    // Password reset token
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },

    // Aggregated rating data
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },

    // Admin/moderation
    isBlocked: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },

    // Last known location (GeoJSON Point)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    // User's saved/frequent addresses
    savedAddresses: [
      {
        label: { type: String, trim: true }, // e.g., 'Home', 'Office', 'College'
        address: { type: String, trim: true },
        coordinates: [Number], // [lon, lat]
      },
    ],

    // Notification preferences
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 2dsphere index for geospatial queries
userSchema.index({ location: '2dsphere' });
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

// Virtual: Full profile completeness
userSchema.virtual('isVerified').get(function () {
  return this.verification.emailVerified && this.verification.phoneVerified;
});

// Pre-save: Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method: Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method: Generate OTP (6-digit)
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  };
  return otp;
};

// Method: Verify OTP
userSchema.methods.verifyOTP = function (inputOtp) {
  if (!this.otp || !this.otp.code) return false;
  if (new Date() > this.otp.expiresAt) return false;
  return this.otp.code === inputOtp;
};

// Method: Update rating
userSchema.methods.updateRating = function (newRating) {
  const totalScore = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = +(totalScore / this.rating.count).toFixed(2);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
