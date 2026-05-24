const StudentService = require('../services/studentService');
const ApiResponse = require('../utils/apiResponse');

const studentController = {
  async create(req, res, next) {
    try {
      const { name, batchId } = req.body;
      const student = await StudentService.createStudent({
        name,
        batchId,
        teacherId: req.user._id,
      });
      return ApiResponse.created(res, { student }, 'Student created successfully');
    } catch (error) {
      next(error);
    }
  },

  async list(req, res, next) {
    try {
      const { batchId, search, page, limit } = req.query;
      const result = await StudentService.getStudents(req.user._id, {
        batchId,
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
      });
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getCredentials(req, res, next) {
    try {
      const credentials = await StudentService.getCredentials(req.params.id, req.user._id);
      return ApiResponse.success(res, { credentials });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const student = await StudentService.updateStudent(
        req.params.id,
        req.user._id,
        req.body
      );
      return ApiResponse.success(res, { student }, 'Student updated');
    } catch (error) {
      next(error);
    }
  },

  async deactivate(req, res, next) {
    try {
      await StudentService.deactivateStudent(req.params.id, req.user._id);
      return ApiResponse.success(res, null, 'Student deactivated');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = studentController;
