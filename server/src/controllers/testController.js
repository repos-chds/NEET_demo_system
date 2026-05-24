const TestService = require('../services/testService');
const ApiResponse = require('../utils/apiResponse');

const testController = {
  async create(req, res, next) {
    try {
      const test = await TestService.createTest({
        ...req.body,
        teacherId: req.user._id,
      });
      return ApiResponse.created(res, { test }, 'Test created');
    } catch (error) {
      next(error);
    }
  },

  async list(req, res, next) {
    try {
      const { status, page, limit } = req.query;
      const result = await TestService.getTests(req.user._id, {
        status,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getDetails(req, res, next) {
    try {
      const test = await TestService.getTestDetails(req.params.id, req.user._id);
      return ApiResponse.success(res, { test });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const test = await TestService.updateTest(req.params.id, req.user._id, req.body);
      return ApiResponse.success(res, { test }, 'Test updated');
    } catch (error) {
      next(error);
    }
  },

  async publish(req, res, next) {
    try {
      const test = await TestService.publishTest(req.params.id, req.user._id);
      return ApiResponse.success(res, { test }, 'Test published');
    } catch (error) {
      next(error);
    }
  },

  async complete(req, res, next) {
    try {
      const test = await TestService.completeTest(req.params.id, req.user._id);
      return ApiResponse.success(res, { test }, 'Test completed');
    } catch (error) {
      next(error);
    }
  },

  async monitoring(req, res, next) {
    try {
      const data = await TestService.getMonitoring(req.params.id, req.user._id);
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = testController;
