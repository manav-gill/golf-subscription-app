const express = require('express');
const router = express.Router();
const { getCharities, selectCharity } = require('../controllers/charityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getCharities);
router.post('/select', protect, selectCharity);

module.exports = router;
