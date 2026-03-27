const Score = require('../models/Score');

// POST /api/scores
const submitScore = async (req, res) => {
  try {
    const { strokes, courseName } = req.body;
    
    if (!strokes || !courseName) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    const score = await Score.create({
      user: req.user.id, // Comes from protect middleware
      strokes,
      courseName
    });

    res.status(201).json(score);
  } catch (error) {
    res.status(500).json({ message: 'Server error while submitting score' });
  }
};

// GET /api/scores
const getMyScores = async (req, res) => {
  try {
    const scores = await Score.find({ user: req.user.id }).sort({ datePlayed: -1 });
    res.status(200).json(scores);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching scores' });
  }
};

module.exports = { submitScore, getMyScores };
