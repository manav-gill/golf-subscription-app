const Charity = require('../models/Charity');
const User = require('../models/User');

// GET /api/charities
const getCharities = async (req, res) => {
  try {
    const charities = await Charity.find({ isActive: true });
    
    // Map _id to id for the frontend
    const mappedCharities = charities.map(c => ({
      id: c._id,
      name: c.name,
      description: c.description
    }));

    res.status(200).json({ success: true, data: mappedCharities });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch charities' });
  }
};

// POST /api/charities/select
const selectCharity = async (req, res) => {
  try {
    const { charityId, contributionPercentage } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        charity_id: charityId,
        contribution_percentage: contributionPercentage 
      },
      { new: true }
    ).select('-password');

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Failed to select charity' });
  }
};

module.exports = { getCharities, selectCharity };
