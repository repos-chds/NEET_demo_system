const AttemptService = require('../services/attemptService');
const ApiResponse = require('../utils/apiResponse');

const attemptController = {
  async join(req, res, next) {
    try {
      const { examCode } = req.body;
      const { attempt, resumed } = await AttemptService.joinTest(examCode, req.user._id);
      const message = resumed ? 'Resuming your attempt' : 'Joined test successfully';
      return ApiResponse.success(res, { attempt, resumed }, message);
    } catch (error) {
      next(error);
    }
  },

  async getAttempt(req, res, next) {
    try {
      const attempt = await AttemptService.getAttempt(req.params.id, req.user._id);
      return ApiResponse.success(res, { attempt });
    } catch (error) {
      next(error);
    }
  },

  async saveAnswer(req, res, next) {
    try {
      const result = await AttemptService.saveAnswer(
        req.params.id,
        req.user._id,
        req.body
      );
      return ApiResponse.success(res, result, 'Answer saved');
    } catch (error) {
      next(error);
    }
  },

  async saveSectionBChoices(req, res, next) {
    try {
      const result = await AttemptService.saveSectionBChoices(
        req.params.id,
        req.user._id,
        req.body
      );
      return ApiResponse.success(res, result, 'Section B choices saved');
    } catch (error) {
      next(error);
    }
  },

  async submit(req, res, next) {
    try {
      const attempt = await AttemptService.submitAttempt(req.params.id, req.user._id);
      return ApiResponse.success(res, { attempt }, 'Test submitted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = attemptController;
