const express = require('express');
const router = express.Router();
const Draw = require('../models/Draw');

// GET /api/draws/current
router.get('/current', async (req, res) => {
  try {
    const draw = await Draw.findOne({ isActive: true });
    if (!draw) return res.status(404).json({ message: 'No active draw found' });
    
    res.status(200).json(draw);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching draw' });
  }
});

module.exports = router;
