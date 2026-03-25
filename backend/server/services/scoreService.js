const supabase = require('../config/supabase');

class ScoreServiceError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ScoreServiceError';
    this.status = status;
  }
}

function validateScoreValue(score) {
  const parsedScore = Number(score);

  if (!Number.isInteger(parsedScore) || parsedScore < 1 || parsedScore > 45) {
    throw new ScoreServiceError('Score must be an integer between 1 and 45', 400);
  }

  return parsedScore;
}

function validateScoreDate(dateValue) {
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new ScoreServiceError('Date must be a valid date', 400);
  }

  return parsedDate.toISOString().slice(0, 10);
}

async function ensureActiveSubscription(userId) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, is_subscribed, subscription_end')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new ScoreServiceError('Failed to validate user subscription', 500);
  }

  if (!user) {
    throw new ScoreServiceError('User not found', 404);
  }

  if (!user.is_subscribed) {
    throw new ScoreServiceError('Active subscription is required to add scores', 403);
  }

  if (!user.subscription_end) {
    throw new ScoreServiceError('Active subscription is required to add scores', 403);
  }

  const subscriptionEnd = new Date(user.subscription_end);
  if (Number.isNaN(subscriptionEnd.getTime()) || Date.now() >= subscriptionEnd.getTime()) {
    throw new ScoreServiceError('Subscription has expired', 403);
  }
}

async function getUserScores(userId) {
  if (!userId) {
    throw new ScoreServiceError('User ID is required', 400);
  }

  const { data: scores, error } = await supabase
    .from('scores')
    .select('id, user_id, score, date, created_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    throw new ScoreServiceError('Failed to fetch user scores', 500);
  }

  return scores || [];
}

async function addScore(userId, score, date) {
  if (!userId) {
    throw new ScoreServiceError('User ID is required', 400);
  }

  const parsedScore = validateScoreValue(score);
  const parsedDate = validateScoreDate(date);

  await ensureActiveSubscription(userId);

  const { error: insertError } = await supabase
    .from('scores')
    .insert({
      user_id: userId,
      score: parsedScore,
      date: parsedDate
    });

  if (insertError) {
    throw new ScoreServiceError('Failed to add score', 500);
  }

  const { data: allScoreIds, error: fetchIdsError } = await supabase
    .from('scores')
    .select('id')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (fetchIdsError) {
    throw new ScoreServiceError('Failed to apply rolling score limit', 500);
  }

  if (allScoreIds && allScoreIds.length > 5) {
    const idsToDelete = allScoreIds.slice(5).map((entry) => entry.id);

    const { error: deleteError } = await supabase
      .from('scores')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      throw new ScoreServiceError('Failed to remove old scores', 500);
    }
  }

  return getUserScores(userId);
}

module.exports = {
  addScore,
  getUserScores,
  ScoreServiceError
};
