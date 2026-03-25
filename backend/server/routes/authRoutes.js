const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/authController');
const validationMiddleware = require('../middleware/validationMiddleware');

const router = express.Router();

router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
  ],
  validationMiddleware,
  authController.signup
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validationMiddleware,
  authController.login
);

module.exports = router;
