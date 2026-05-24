const express = require('express');
const Joi = require('joi');
const attemptController = require('../controllers/attemptController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate, authorize('student'));

const joinSchema = Joi.object({
  examCode: Joi.string().trim().uppercase().length(6).required(),
});

const answerSchema = Joi.object({
  questionId: Joi.string().hex().length(24).required(),
  selectedOption: Joi.string().valid('A', 'B', 'C', 'D', null).allow(null),
  markedForReview: Joi.boolean().optional(),
});

const sectionBSchema = Joi.object({
  subject: Joi.string().valid('Physics', 'Chemistry', 'Botany', 'Zoology').required(),
  questionIds: Joi.array().items(Joi.string().hex().length(24)).max(10).required(),
});

router.post('/join', validate(joinSchema), attemptController.join);
router.get('/:id', attemptController.getAttempt);
router.put('/:id/answer', validate(answerSchema), attemptController.saveAnswer);
router.put('/:id/section-b', validate(sectionBSchema), attemptController.saveSectionBChoices);
router.post('/:id/submit', attemptController.submit);

module.exports = router;
