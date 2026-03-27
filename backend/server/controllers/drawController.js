const drawService = require('../services/drawService');

async function runDraw(req, res) {
  const userId = req.user?.id || req.user?.userId;
  console.log('[drawController.runDraw] route hit', {
    method: req.method,
    path: req.originalUrl,
    userId
  });

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
    console.error('[drawController.runDraw] failed', {
      userId,
      error: error.message,
      status: error.status
    });
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to run draw'
    });
  }
}

async function getCurrentDraw(req, res) {
  const userId = req.user?.id || req.user?.userId;
  console.log('[drawController.getCurrentDraw] route hit', {
    method: req.method,
    path: req.originalUrl,
    userId
  });

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
    console.error('[drawController.getCurrentDraw] failed', {
      userId,
      error: error.message,
      status: error.status
    });
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
