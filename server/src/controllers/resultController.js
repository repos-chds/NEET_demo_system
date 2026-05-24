const ResultService = require('../services/resultService');
const ApiResponse = require('../utils/apiResponse');

const resultController = {
  async testResults(req, res, next) {
    try {
      const data = await ResultService.getTestResults(req.params.testId, req.user._id);
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  },

  async attemptResult(req, res, next) {
    try {
      const attempt = await ResultService.getAttemptResult(
        req.params.attemptId,
        req.user._id,
        req.user.role
      );
      return ApiResponse.success(res, { attempt });
    } catch (error) {
      next(error);
    }
  },

  async testAnalytics(req, res, next) {
    try {
      const data = await ResultService.getTestAnalytics(req.params.testId, req.user._id);
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = resultController;
