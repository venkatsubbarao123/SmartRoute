const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const User = require('../models/User');
const store = require('../services/dataStore');
const env = require('../config/env');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * Generate a signed JWT token for a user
 */
const signToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRE });
};

/**
 * Send token in response with user data
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = signToken(user._id);

  // Remove sensitive fields
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.otp;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpire;

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: userObj,
  });
};

/**
 * Send OTP via email (mock for demo; real implementation uses nodemailer)
 */
const sendOTPEmail = async (email, otp, name) => {
  try {
    if (!env.EMAIL_USER || !env.EMAIL_PASS) {
      // Mock mode: just log in development
      if (env.IS_DEVELOPMENT) {
        console.log(`📧 [DEV] OTP for ${email}: ${otp}`);
      }
      return;
    }

    const transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: false,
      auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"SmartRoute" <${env.EMAIL_USER}>`,
      to: email,
      subject: 'SmartRoute - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #2E86AB;">Welcome to SmartRoute, ${name}!</h2>
          <p>Your email verification OTP is:</p>
          <h1 style="letter-spacing: 8px; color: #333; text-align: center;">${otp}</h1>
          <p>This OTP expires in <strong>10 minutes</strong>.</p>
          <p style="color: #888; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Email send error:', err.message);
    // Don't throw - email failure shouldn't block registration
  }
};

// ─── REGISTER ────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user and send verification OTP
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, userType, studentInfo, employeeInfo } = req.body;

  if (mongoose.connection.readyState !== 1) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        message: 'Database service is temporarily unavailable. Please try again shortly.',
      });
    }
    const existing = store.users.find((u) => u.email === email || (phone && u.phone === phone));
    if (existing) {
      throw new AppError('A user with this email or phone already exists.', 400);
    }
    const newUser = {
      _id: `u-${Date.now()}`,
      name,
      email,
      phone: phone || '',
      userType: userType || 'student',
      verification: {
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        studentVerified: userType === 'student',
        employeeVerified: userType === 'employee',
      },
      rating: { average: 5.0, count: 0 },
      ridesCompleted: 0,
      savings: 0,
    };
    if (userType === 'student' && studentInfo) newUser.studentInfo = studentInfo;
    if (userType === 'employee' && employeeInfo) newUser.employeeInfo = employeeInfo;

    store.users.push(newUser);
    return sendTokenResponse(newUser, 201, res, 'Registration successful!');
  }

  // Check for existing user
  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'phone';
    throw new AppError(`A user with this ${field} already exists.`, 400);
  }

  // Build user object
  const cleanPhone = (phone || '').replace(/[\s\-()]/g, '');
  const userData = {
    name,
    email,
    phone: cleanPhone || phone,
    password,
    userType: userType || 'general',
  };

  if (userType === 'student') {
    userData.studentInfo = studentInfo || {
      college: req.body.organization || 'Campus Institute',
      collegeId: req.body.collegeId || 'STU-' + Date.now().toString().slice(-4),
    };
  }
  if (userType === 'employee') {
    userData.employeeInfo = employeeInfo || {
      company: req.body.organization || 'Corporate Office',
      employeeId: req.body.employeeId || 'EMP-' + Date.now().toString().slice(-4),
    };
  }

  try {
    const user = new User(userData);
    const otp = user.generateOTP();
    await user.save();

    // Send verification OTP asynchronously
    sendOTPEmail(email, otp, name).catch((e) => console.warn('OTP send error:', e.message));

    // Return token and sanitized user profile
    return sendTokenResponse(user, 201, res, 'Registration successful!');
  } catch (err) {
    if (process.env.NODE_ENV !== 'production' && (err.message.includes('primary') || err.name === 'MongoServerError')) {
      console.warn('⚠️ Replica write error encountered, saving user to memory store:', err.message);
      const fallbackUser = {
        _id: `u-${Date.now()}`,
        name,
        email,
        phone: cleanPhone,
        userType: userType || 'general',
        verification: {
          emailVerified: true,
          phoneVerified: true,
          identityVerified: true,
          studentVerified: userType === 'student',
          employeeVerified: userType === 'employee',
        },
        rating: { average: 5.0, count: 0 },
        ridesCompleted: 0,
        savings: 0,
      };
      store.users.push(fallbackUser);
      return sendTokenResponse(fallbackUser, 201, res, 'Registration successful!');
    }
    throw err;
  }
});

// ─── VERIFY OTP ──────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify email OTP and activate account
 * @access  Public
 */
const verifyOTP = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  const user = await User.findById(userId).select('+otp');
  if (!user) throw new AppError('User not found.', 404);

  if (user.verification.emailVerified) {
    return res.json({ success: true, message: 'Email already verified.' });
  }

  if (!user.verifyOTP(otp)) {
    throw new AppError('Invalid or expired OTP. Please request a new one.', 400);
  }

  user.verification.emailVerified = true;
  user.otp = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Email verified successfully!');
});

// ─── RESEND OTP ──────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend email verification OTP
 * @access  Public
 */
const resendOTP = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId).select('+otp');
  if (!user) throw new AppError('User not found.', 404);
  if (user.verification.emailVerified) {
    throw new AppError('Email is already verified.', 400);
  }

  const otp = user.generateOTP();
  await user.save();
  await sendOTPEmail(user.email, otp, user.name);

  res.json({
    success: true,
    message: 'A new OTP has been sent to your email.',
    ...(env.IS_DEVELOPMENT && { otp }),
  });
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/login
 * @desc    Login with email/phone and password, returns JWT
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;

  if (!password || (!email && !phone)) {
    throw new AppError('Please provide email/phone and password.', 400);
  }

  if (mongoose.connection.readyState !== 1) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        message: 'Database service is temporarily unavailable. Please try again shortly.',
      });
    }
    const user = store.users.find((u) => u.email === email || (phone && u.phone === phone));
    if (!user) throw new AppError('Invalid credentials.', 401);
    return sendTokenResponse(user, 200, res, 'Login successful!');
  }

  const query = email ? { email } : { phone };
  const user = await User.findOne(query).select('+password');

  if (!user) throw new AppError('Invalid credentials.', 401);
  if (user.isBlocked) throw new AppError('Your account has been blocked. Contact support.', 403);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid credentials.', 401);

  sendTokenResponse(user, 200, res, 'Login successful!');
});

// ─── LOGOUT ──────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (client clears token; server-side blacklisting can be added)
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ─── GET ME ──────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, user: req.user });
  }
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

// ─── UPDATE PROFILE ──────────────────────────────────────────────────────────

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user's profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'studentInfo', 'employeeInfo', 'savedAddresses', 'notificationPreferences'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  // Handle profile photo upload
  if (req.file) {
    updates.profilePhoto = `/uploads/${req.file.filename}`;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, message: 'Profile updated successfully.', user });
});

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset OTP to email
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond with success to prevent email enumeration
  if (!user) {
    return res.json({ success: true, message: 'If an account with that email exists, a reset OTP has been sent.' });
  }

  const otp = user.generateOTP();
  user.resetPasswordToken = otp;
  user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendOTPEmail(email, otp, user.name);

  res.json({
    success: true,
    message: 'Password reset OTP sent to your email.',
    ...(env.IS_DEVELOPMENT && { otp }),
  });
});

// ─── RESET PASSWORD ──────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using OTP
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({
    email,
    resetPasswordToken: otp,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) throw new AppError('Invalid or expired reset OTP.', 400);

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successful!');
});

// ─── CHANGE PASSWORD ─────────────────────────────────────────────────────────

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect.', 400);

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password changed successfully!');
});

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword,
};
