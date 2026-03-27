const express = require('express');
const router = express.Router();
const { submitScore, getMyScores } = require('../controllers/scoreController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, submitScore);
router.get('/', protect, getMyScores);

module.exports = router;
