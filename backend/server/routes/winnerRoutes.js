const express = require('express');
const { body, param } = require('express-validator');

const authMiddleware = require('../middleware/authMiddleware');
const winnerController = require('../controllers/winnerController');

const router = express.Router();

router.use(authMiddleware);

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin role is required for this route'
    });
  }

  return next();
}

router.get(
  '/draw/:drawId',
  [param('drawId').isUUID().withMessage('drawId must be a valid UUID')],
  adminOnly,
  winnerController.getWinnersByDraw
);

router.get('/me', winnerController.getMyWinnings);

router.patch(
  '/:id/verify',
  [
    param('id').isUUID().withMessage('id must be a valid UUID'),
    body('status').isIn(['approved', 'paid']).withMessage('status must be either approved or paid')
  ],
  adminOnly,
  winnerController.verifyWinnerStatus
);

router.post(
  '/distribute/:drawId',
  [param('drawId').isUUID().withMessage('drawId must be a valid UUID')],
  adminOnly,
  winnerController.distributePrizes
);

module.exports = router;
