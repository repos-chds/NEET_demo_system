const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const env = require('../config/env');

class AuthService {
  /**
   * Generate access and refresh tokens
   */
  static generateTokens(userId, role, sessionId) {
    const accessToken = jwt.sign(
      { userId, role, sessionId },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId, role, sessionId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Login user (teacher via email, student via username)
   */
  static async login({ identifier, password }) {
    // Try to find by email (teacher) or username (student)
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
      ],
      isActive: true,
    }).select('+password');

    if (!user) {
      throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });
    }

    // Generate session ID for single-session enforcement
    const sessionId = crypto.randomUUID();

    // Update session ID (enforces single session for students)
    user.currentSessionId = sessionId;
    await user.save({ validateBeforeSave: false });

    const tokens = AuthService.generateTokens(user._id, user.role, sessionId);

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw Object.assign(new Error('Refresh token not found.'), { statusCode: 401 });
    }

    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw Object.assign(new Error('User not found.'), { statusCode: 401 });
    }

    // Check session validity for students
    if (user.role === 'student' && decoded.sessionId !== user.currentSessionId) {
      throw Object.assign(new Error('Session invalidated.'), { statusCode: 401 });
    }

    const tokens = AuthService.generateTokens(user._id, user.role, decoded.sessionId);

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  /**
   * Logout user
   */
  static async logout(userId) {
    await User.findByIdAndUpdate(userId, { currentSessionId: null });
  }
}

module.exports = AuthService;
