const express = require('express');
const testController = require('../controllers/testController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('teacher'));

router.get('/', testController.list);
router.post('/', testController.create);
router.get('/:id', testController.getDetails);
router.put('/:id', testController.update);
router.post('/:id/publish', testController.publish);
router.post('/:id/complete', testController.complete);
router.get('/:id/monitoring', testController.monitoring);

module.exports = router;
