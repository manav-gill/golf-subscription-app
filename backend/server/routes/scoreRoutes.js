const express = require('express');
const { body } = require('express-validator');

const authMiddleware = require('../middleware/authMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const scoreController = require('../controllers/scoreController');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  subscriptionMiddleware,
  [
    body('score').isInt({ min: 1, max: 45 }).withMessage('Score must be an integer between 1 and 45'),
    body('date').isISO8601({ strict: true }).withMessage('Date must be a valid date in ISO format')
  ],
  validationMiddleware,
  scoreController.addScore
);

router.get('/', scoreController.getScores);

module.exports = router;
