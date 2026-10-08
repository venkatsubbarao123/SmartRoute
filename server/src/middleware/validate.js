const { validationResult } = require('express-validator');

/**
 * validate middleware
 * Runs after express-validator chains and returns formatted errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors into a clean object: { field: 'message' }
    const formatted = {};
    errors.array().forEach((err) => {
      if (!formatted[err.path]) {
        formatted[err.path] = err.msg;
      }
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatted,
    });
  }
  next();
};

module.exports = validate;
