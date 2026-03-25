const express = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const drawController = require('../controllers/drawController');

const router = express.Router();

router.use(authMiddleware);

router.post('/run', requireRole('admin'), drawController.runDraw);
router.get('/current', drawController.getCurrentDraw);

module.exports = router;
