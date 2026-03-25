const express = require('express');
const { body } = require('express-validator');

const authMiddleware = require('../middleware/authMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', userController.getMe);

router.put(
  '/me',
  [
    body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('role').not().exists().withMessage('role cannot be updated'),
    body('is_subscribed').not().exists().withMessage('is_subscribed cannot be updated'),
    body('subscription_start').not().exists().withMessage('subscription_start cannot be updated'),
    body('subscription_end').not().exists().withMessage('subscription_end cannot be updated'),
    body().custom((value) => {
      const hasEmail = value && Object.prototype.hasOwnProperty.call(value, 'email');
      if (!hasEmail) {
        throw new Error('At least one allowed field must be provided');
      }
      return true;
    })
  ],
  validationMiddleware,
  userController.updateMe
);

router.post('/subscribe', userController.subscribe);

module.exports = router;
