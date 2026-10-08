const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const store = require('../services/dataStore');
const env = require('../config/env');

/**
 * protect middleware
 * Verifies JWT token and attaches authenticated user to req.user
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token has expired. Please log in again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    // Fetch fresh user from DB or in-memory store
    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findById(decoded.id).select('-password');
    } else {
      user = store.users.find((u) => u._id === decoded.id || u.email === decoded.id || u.email === decoded.email);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact support.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};

/**
 * authorize middleware factory
 * Restricts route access to specific roles/flags
 * Usage: authorize('admin') or authorize('admin', 'verified')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    // Check admin role
    if (roles.includes('admin') && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // Check email verified
    if (roles.includes('verified') && !req.user.verification.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before accessing this resource.',
      });
    }

    next();
  };
};

/**
 * optionalAuth middleware
 * Attaches user to req if token present, but does not block if absent
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user && !user.isBlocked) {
          req.user = user;
        }
      } catch (err) {
        // Silently fail for optional auth
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = { protect, authorize, optionalAuth };
