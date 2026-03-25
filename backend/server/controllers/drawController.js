const drawService = require('../services/drawService');

async function runDraw(req, res) {
  try {
    const draw = await drawService.createDraw();
    const summary = await drawService.evaluateWinners(draw.id);

    return res.status(201).json({
      success: true,
      message: 'Draw executed successfully',
      data: {
        draw,
        summary
      }
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to run draw'
    });
  }
}

async function getCurrentDraw(req, res) {
  try {
    const draw = await drawService.getCurrentDraw();

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'No draw found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Current draw fetched successfully',
      data: draw
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to fetch current draw'
    });
  }
}

module.exports = {
  runDraw,
  getCurrentDraw
};
