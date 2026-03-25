const { validationResult } = require('express-validator');

const scoreService = require('../services/scoreService');

async function addScore(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const { score, date } = req.body;
    const scores = await scoreService.addScore(req.user.userId, score, date);

    return res.status(201).json({
      success: true,
      message: 'Score added successfully',
      data: scores
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to add score'
    });
  }
}

async function getScores(req, res) {
  try {
    const scores = await scoreService.getUserScores(req.user.userId);

    return res.status(200).json({
      success: true,
      message: 'Scores fetched successfully',
      data: scores
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to fetch scores'
    });
  }
}

module.exports = {
  addScore,
  getScores
};
