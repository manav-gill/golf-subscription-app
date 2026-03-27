const express = require('express');
const router = express.Router();
const Winner = require('../models/Winner');
const { protect } = require('../middleware/authMiddleware');

// GET /api/winners/me
router.get('/me', protect, async (req, res) => {
  try {
    // .populate() pulls in the data from referenced collections using the ObjectId!
    const wins = await Winner.find({ user: req.user.id })
                             .populate('draw')
                             .populate('charity');
    res.status(200).json(wins);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching winner history' });
  }
});

module.exports = router;
