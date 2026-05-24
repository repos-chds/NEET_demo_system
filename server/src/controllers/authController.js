const AuthService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');
const env = require('../config/env');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const authController = {
  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { identifier, password } = req.body;
      const { user, tokens } = await AuthService.login({ identifier, password });

      res.cookie('accessToken', tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000, // 15 min
      });
      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

      return ApiResponse.success(res, { user }, 'Login successful');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const { user, tokens } = await AuthService.refreshToken(refreshToken);

      res.cookie('accessToken', tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

      return ApiResponse.success(res, { user }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      if (req.user) {
        await AuthService.logout(req.user._id);
      }

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/me
   */
  async me(req, res) {
    return ApiResponse.success(res, { user: req.user });
  },
};

module.exports = authController;
