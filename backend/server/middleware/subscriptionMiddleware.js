const supabase = require('../config/supabase');

async function subscriptionMiddleware(req, res, next) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, is_subscribed, subscription_end')
      .eq('id', req.user.userId)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to validate subscription'
      });
    }

    if (!user || !user.is_subscribed || !user.subscription_end) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription is required'
      });
    }

    const subscriptionEnd = new Date(user.subscription_end);
    if (Number.isNaN(subscriptionEnd.getTime()) || Date.now() >= subscriptionEnd.getTime()) {
      return res.status(403).json({
        success: false,
        message: 'Subscription has expired'
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = subscriptionMiddleware;
