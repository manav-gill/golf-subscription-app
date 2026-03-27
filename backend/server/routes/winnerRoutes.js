const express = require('express');
const router = express.Router();
const Winner = require('../models/Winner');
const { protect } = require('../middleware/authMiddleware');

// GET /api/winners/me
router.get('/me', protect, async (req, res) => {
  try {
    const wins = await Winner.find({ user: req.user.id })
                             .populate('draw')
                             .populate('charity');
                               
    const mappedWins = wins.map(w => {
      const wObj = w.toObject();
      wObj.draw_id = wObj.draw?._id || wObj.draw; // map to draw_id string for frontend
      return wObj;
    });

    res.status(200).json({ success: true, data: mappedWins });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching winner history' });
  }
});

module.exports = router;
