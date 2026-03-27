const express = require('express');
const router = express.Router();
const Draw = require('../models/Draw');

// GET /api/draw/current
router.get('/current', async (req, res) => {
  try {
    const draw = await Draw.findOne({ isActive: true });
    if (!draw) return res.status(404).json({ message: 'No active draw found' });
    
    // Convert to object and map _id to id so frontend can link them
    const drawObj = draw.toObject();
    drawObj.id = drawObj._id;

    res.status(200).json({ success: true, data: drawObj });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching draw' });
  }
});

module.exports = router;
