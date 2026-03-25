const { validationResult } = require('express-validator');

const charityService = require('../services/charityService');

function validationErrorResponse(req, res) {
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

async function getAllCharities(req, res) {
  try {
    const charities = await charityService.getAllCharities();

    return res.status(200).json({
      success: true,
      message: 'Charities fetched successfully',
      data: charities
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to fetch charities'
    });
  }
}

async function getCharityById(req, res) {
  const validationError = validationErrorResponse(req, res);
  if (validationError) {
    return validationError;
  }

  try {
    const charity = await charityService.getCharityById(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Charity fetched successfully',
      data: charity
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to fetch charity'
    });
  }
}

async function createCharity(req, res) {
  const validationError = validationErrorResponse(req, res);
  if (validationError) {
    return validationError;
  }

  try {
    const charity = await charityService.createCharity(req.body);

    return res.status(201).json({
      success: true,
      message: 'Charity created successfully',
      data: charity
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to create charity'
    });
  }
}

async function updateCharity(req, res) {
  const validationError = validationErrorResponse(req, res);
  if (validationError) {
    return validationError;
  }

  try {
    const charity = await charityService.updateCharity(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Charity updated successfully',
      data: charity
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update charity'
    });
  }
}

async function deleteCharity(req, res) {
  const validationError = validationErrorResponse(req, res);
  if (validationError) {
    return validationError;
  }

  try {
    const charity = await charityService.deleteCharity(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Charity deleted successfully',
      data: charity
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete charity'
    });
  }
}

async function selectCharity(req, res) {
  const validationError = validationErrorResponse(req, res);
  if (validationError) {
    return validationError;
  }

  try {
    const { charityId, contributionPercentage } = req.body;

    const user = await charityService.selectUserCharity(
      req.user.userId,
      charityId,
      contributionPercentage
    );

    return res.status(200).json({
      success: true,
      message: 'Charity selection saved successfully',
      data: user
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to select charity'
    });
  }
}

module.exports = {
  getAllCharities,
  getCharityById,
  createCharity,
  updateCharity,
  deleteCharity,
  selectCharity
};
