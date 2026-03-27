const express = require('express');
const router = express.Router();
const { getCharities, selectCharity, addCharity } = require('../controllers/charityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getCharities);
router.post('/', protect, addCharity);
router.post('/select', protect, selectCharity);

module.exports = router;
