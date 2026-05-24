const { Batch } = require('../models');
const ApiResponse = require('../utils/apiResponse');

const batchController = {
  async create(req, res, next) {
    try {
      const batch = await Batch.create({
        name: req.body.name,
        teacher: req.user._id,
      });
      return ApiResponse.created(res, { batch }, 'Batch created');
    } catch (error) {
      next(error);
    }
  },

  async list(req, res, next) {
    try {
      const batches = await Batch.find({ teacher: req.user._id })
        .populate('studentCount')
        .sort({ createdAt: -1 });
      return ApiResponse.success(res, { batches });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const batch = await Batch.findOneAndUpdate(
        { _id: req.params.id, teacher: req.user._id },
        { name: req.body.name },
        { new: true }
      );
      if (!batch) return ApiResponse.notFound(res, 'Batch not found');
      return ApiResponse.success(res, { batch }, 'Batch updated');
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const batch = await Batch.findOneAndDelete({
        _id: req.params.id,
        teacher: req.user._id,
      });
      if (!batch) return ApiResponse.notFound(res, 'Batch not found');
      return ApiResponse.success(res, null, 'Batch deleted');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = batchController;
