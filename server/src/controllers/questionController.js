const { Question } = require('../models');
const ApiResponse = require('../utils/apiResponse');

const questionController = {
  /**
   * GET /api/questions — List/filter questions
   */
  async list(req, res, next) {
    try {
      const { subject, chapter, difficulty, search, page = 1, limit = 50 } = req.query;

      const query = {};
      if (subject) query.subject = subject;
      if (chapter) query.chapter = chapter;
      if (difficulty) query.difficulty = difficulty;
      if (search) {
        query.questionText = { $regex: search, $options: 'i' };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [questions, total] = await Promise.all([
        Question.find(query)
          .sort({ subject: 1, chapter: 1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Question.countDocuments(query),
      ]);

      return ApiResponse.success(res, {
        questions,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/questions/chapters — Get unique chapters grouped by subject
   */
  async chapters(req, res, next) {
    try {
      const result = await Question.aggregate([
        {
          $group: {
            _id: { subject: '$subject', chapter: '$chapter' },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.subject',
            chapters: {
              $push: { name: '$_id.chapter', count: '$count' },
            },
            totalQuestions: { $sum: '$count' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const grouped = {};
      for (const item of result) {
        grouped[item._id] = {
          chapters: item.chapters.sort((a, b) => a.name.localeCompare(b.name)),
          totalQuestions: item.totalQuestions,
        };
      }

      return ApiResponse.success(res, { subjects: grouped });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/questions/:id — Get single question
   */
  async getById(req, res, next) {
    try {
      const question = await Question.findById(req.params.id);
      if (!question) return ApiResponse.notFound(res, 'Question not found');
      return ApiResponse.success(res, { question });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = questionController;
