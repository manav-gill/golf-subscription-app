const { validationResult } = require('express-validator');

const winnerService = require('../services/winnerService');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return null;
  }

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array()
  });
}

async function getWinnersByDraw(req, res) {
  const validationErrorResponse = handleValidation(req, res);
  if (validationErrorResponse) {
    return validationErrorResponse;
  }

  try {
    const winners = await winnerService.getWinnersByDraw(req.params.drawId);

    return res.status(200).json({
      success: true,
      message: 'Winners fetched successfully',
      data: winners
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to fetch winners'
    });
  }
}

async function getMyWinnings(req, res) {
  try {
    const winnings = await winnerService.getUserWinnings(req.user.userId);

    return res.status(200).json({
      success: true,
      message: 'User winnings fetched successfully',
      data: winnings
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to fetch user winnings'
    });
  }
}

async function verifyWinnerStatus(req, res) {
  const validationErrorResponse = handleValidation(req, res);
  if (validationErrorResponse) {
    return validationErrorResponse;
  }

  try {
    const updatedWinner = await winnerService.verifyWinner(req.params.id, req.body.status);

    return res.status(200).json({
      success: true,
      message: 'Winner status updated successfully',
      data: updatedWinner
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update winner status'
    });
  }
}

async function distributePrizes(req, res) {
  const validationErrorResponse = handleValidation(req, res);
  if (validationErrorResponse) {
    return validationErrorResponse;
  }

  try {
    const distribution = await winnerService.calculatePrizeDistribution(req.params.drawId);

    return res.status(200).json({
      success: true,
      message: 'Prize distribution completed successfully',
      data: distribution
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to distribute prizes'
    });
  }
}

module.exports = {
  getWinnersByDraw,
  getMyWinnings,
  verifyWinnerStatus,
  distributePrizes
};
