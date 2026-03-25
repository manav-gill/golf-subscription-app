const { validationResult } = require('express-validator');

const userService = require('../services/userService');

async function getMe(req, res) {
  try {
    const user = await userService.getUserById(req.user.userId);

    return res.status(200).json({
      success: true,
      message: 'User profile fetched successfully',
      data: user
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to fetch user profile'
    });
  }
}

async function updateMe(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const updatedUser = await userService.updateUser(req.user.userId, req.body);

    return res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update user profile'
    });
  }
}

async function subscribe(req, res) {
  try {
    const updatedUser = await userService.activateSubscription(req.user.userId);

    return res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      data: updatedUser
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to activate subscription'
    });
  }
}

module.exports = {
  getMe,
  updateMe,
  subscribe
};
