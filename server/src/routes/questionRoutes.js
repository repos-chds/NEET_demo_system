const express = require('express');
const questionController = require('../controllers/questionController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('teacher'));

router.get('/', questionController.list);
router.get('/chapters', questionController.chapters);
router.get('/:id', questionController.getById);

module.exports = router;
