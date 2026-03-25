const express = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const drawController = require('../controllers/drawController');

const router = express.Router();

router.use(authMiddleware);

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin role is required to run draws'
    });
  }

  return next();
}

router.post('/run', adminOnly, drawController.runDraw);
router.get('/current', drawController.getCurrentDraw);

module.exports = router;
