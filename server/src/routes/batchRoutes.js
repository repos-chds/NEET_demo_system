const express = require('express');
const Joi = require('joi');
const batchController = require('../controllers/batchController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate, authorize('teacher'));

const batchSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
});

router.get('/', batchController.list);
router.post('/', validate(batchSchema), batchController.create);
router.put('/:id', validate(batchSchema), batchController.update);
router.delete('/:id', batchController.remove);

module.exports = router;
