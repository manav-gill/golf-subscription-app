const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/authController');

const router = express.Router();

router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
  ],
  authController.signup
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  authController.login
);

module.exports = router;
