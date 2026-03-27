const express = require('express');
const router = express.Router();
const Draw = require('../models/Draw');
const { protect } = require('../middleware/authMiddleware');

// POST /api/draw/run
router.post('/run', protect, async (req, res) => {
  try {
    // 1. Generate 5 random winning numbers (1-45)
    const numbers = [];
    while (numbers.length < 5) {
      const r = Math.floor(Math.random() * 45) + 1;
      if (numbers.indexOf(r) === -1) numbers.push(r);
    }
    
    const currentDraw = await Draw.findOneAndUpdate(
      { isActive: true }, 
      { isActive: false, numbers },
      { new: true }
    );
    
    // Create new draw for next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthString = nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    await Draw.create({
      month: monthString,
      prize: '$1,000 Cash Prize',
      isActive: true
    });
    
    const drawObj = currentDraw ? currentDraw.toObject() : { numbers };
    if (drawObj._id) drawObj.id = drawObj._id;

    res.status(200).json({ success: true, data: { draw: drawObj } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to run draw' });
  }
});

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
