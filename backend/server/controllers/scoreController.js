const Score = require('../models/Score');

// POST /api/scores
const submitScore = async (req, res) => {
  try {
    const { score, date } = req.body;
    
    if (!score) {
      return res.status(400).json({ message: 'Please add a score value' });
    }

    const newScore = await Score.create({
      user: req.user.id, // Comes from protect middleware
      score: score,
      datePlayed: date ? new Date(date) : Date.now()
    });

    res.status(201).json(newScore);
  } catch (error) {
    res.status(500).json({ message: 'Server error while submitting score' });
  }
};

// GET /api/scores
const getMyScores = async (req, res) => {
  try {
    const scores = await Score.find({ user: req.user.id }).sort({ datePlayed: -1 });
    res.status(200).json({
      success: true,
      data: scores
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching scores' });
  }
};

module.exports = { submitScore, getMyScores };
