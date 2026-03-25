const express = require('express');
const { body, param } = require('express-validator');

const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const charityController = require('../controllers/charityController');

const router = express.Router();

router.get('/charities', charityController.getAllCharities);

router.get(
  '/charities/:id',
  [param('id').isUUID().withMessage('id must be a valid UUID')],
  validationMiddleware,
  charityController.getCharityById
);

router.post(
  '/charities/select',
  authMiddleware,
  [
    body('charityId').isUUID().withMessage('charityId must be a valid UUID'),
    body('contributionPercentage')
      .isInt({ min: 10 })
      .withMessage('contributionPercentage must be an integer greater than or equal to 10')
  ],
  validationMiddleware,
  charityController.selectCharity
);

router.post(
  '/charities',
  authMiddleware,
  requireRole('admin'),
  [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('description').optional({ nullable: true }).isString().withMessage('description must be a string'),
    body('image_url').optional({ nullable: true }).isURL().withMessage('image_url must be a valid URL')
  ],
  validationMiddleware,
  charityController.createCharity
);

router.put(
  '/charities/:id',
  authMiddleware,
  requireRole('admin'),
  [
    param('id').isUUID().withMessage('id must be a valid UUID'),
    body('name').optional().trim().notEmpty().withMessage('name cannot be empty when provided'),
    body('description').optional({ nullable: true }).isString().withMessage('description must be a string'),
    body('image_url').optional({ nullable: true }).isURL().withMessage('image_url must be a valid URL')
  ],
  validationMiddleware,
  charityController.updateCharity
);

router.delete(
  '/charities/:id',
  authMiddleware,
  requireRole('admin'),
  [param('id').isUUID().withMessage('id must be a valid UUID')],
  validationMiddleware,
  charityController.deleteCharity
);

module.exports = router;
