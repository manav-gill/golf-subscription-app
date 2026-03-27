const Charity = require('../models/Charity');
const User = require('../models/User');

// GET /api/charities
const getCharities = async (req, res) => {
  try {
    const charities = await Charity.find({ isActive: true });
    res.status(200).json(charities);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch charities' });
  }
};

// POST /api/charities/select
const selectCharity = async (req, res) => {
  try {
    const { charityId } = req.body;
    
    // Update the user's selectedCharity field
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { selectedCharity: charityId },
      { new: true } // Returns the updated document
    ).select('-password');

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Failed to select charity' });
  }
};

module.exports = { getCharities, selectCharity };
