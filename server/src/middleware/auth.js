const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const ApiResponse = require('../utils/apiResponse');

/**
 * Verify JWT access token from httpOnly cookie
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return ApiResponse.unauthorized(res, 'Access token not found. Please login.');
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return ApiResponse.unauthorized(res, 'User not found or deactivated.');
    }

    // Single-session enforcement for students
    if (user.role === 'student' && decoded.sessionId !== user.currentSessionId) {
      return ApiResponse.unauthorized(res, 'Session expired. You are logged in on another device.');
    }

    req.user = user;
    req.sessionId = decoded.sessionId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Access token expired.');
    }
    return ApiResponse.unauthorized(res, 'Invalid access token.');
  }
};

/**
 * Role-based access control middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }
    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, 'You do not have permission to perform this action.');
    }
    next();
  };
};

module.exports = { authenticate, authorize };
