const express = require('express');
const resultController = require('../controllers/resultController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Teacher-only routes
router.get('/test/:testId', authorize('teacher'), resultController.testResults);
router.get('/test/:testId/analytics', authorize('teacher'), resultController.testAnalytics);

// Both teacher and student can view attempt results
router.get('/attempt/:attemptId', resultController.attemptResult);

module.exports = router;
