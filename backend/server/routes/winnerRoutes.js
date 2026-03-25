const express = require('express');
const { body, param } = require('express-validator');

const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const winnerController = require('../controllers/winnerController');

const router = express.Router();

router.use(authMiddleware);

router.get(
  '/draw/:drawId',
  [param('drawId').isUUID().withMessage('drawId must be a valid UUID')],
  validationMiddleware,
  requireRole('admin'),
  winnerController.getWinnersByDraw
);

router.get('/me', winnerController.getMyWinnings);

router.patch(
  '/:id/verify',
  [
    param('id').isUUID().withMessage('id must be a valid UUID'),
    body('status').isIn(['approved', 'paid']).withMessage('status must be either approved or paid')
  ],
  validationMiddleware,
  requireRole('admin'),
  winnerController.verifyWinnerStatus
);

router.post(
  '/distribute/:drawId',
  [param('drawId').isUUID().withMessage('drawId must be a valid UUID')],
  validationMiddleware,
  requireRole('admin'),
  winnerController.distributePrizes
);

module.exports = router;
