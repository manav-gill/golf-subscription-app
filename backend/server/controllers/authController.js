const { validationResult } = require('express-validator');

const authService = require('../services/authService');

async function signup(req, res) {
  console.log('Signup request body:', req.body);
  console.log('Signup step: validation start');

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Signup step: validation failed', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing fields'
      });
    }

    console.log('Signup step: calling authService.registerUser');
    const result = await authService.registerUser(name, email, password);
    console.log('Signup step: authService.registerUser success');

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    console.error('Signup controller error:', error);

    if (error.message === 'User already exists') {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to register user',
      stack: error.stack
    });
  }
}

async function login(req, res) {
  console.log('Login request body:', req.body);
  console.log('Login step: validation start');

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Login step: validation failed', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const { email, password } = req.body;
    console.log('Login step: calling authService.loginUser');
    const result = await authService.loginUser(email, password);
    console.log('Login step: authService.loginUser success');

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    console.error('Login controller error:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to login user',
      stack: error.stack
    });
  }
}

module.exports = {
  signup,
  login
};
