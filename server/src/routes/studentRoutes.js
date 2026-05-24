const express = require('express');
const Joi = require('joi');
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes require teacher auth
router.use(authenticate, authorize('teacher'));

const createSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  batchId: Joi.string().hex().length(24).optional().allow(null, ''),
});

const updateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  batchId: Joi.string().hex().length(24).optional().allow(null, ''),
});

router.get('/', studentController.list);
router.post('/', validate(createSchema), studentController.create);
router.get('/:id/credentials', studentController.getCredentials);
router.put('/:id', validate(updateSchema), studentController.update);
router.delete('/:id', studentController.deactivate);

module.exports = router;
