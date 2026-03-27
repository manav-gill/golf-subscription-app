const supabase = require('../config/supabase');

class WinnerServiceError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'WinnerServiceError';
    this.status = status;
  }
}

const fixedPoolPerSubscriber = 100;

function ensureUuidLike(id, fieldName) {
  if (!id || typeof id !== 'string') {
    throw new WinnerServiceError(`${fieldName} is required`, 400);
  }
}

async function getWinnersByDraw(drawId) {
  ensureUuidLike(drawId, 'Draw ID');

  console.log('[winnerService.getWinnersByDraw] Fetching winners for draw', { drawId });

  const { data: winners, error } = await supabase
    .from('winners')
    .select('id, user_id, draw_id, match_count, prize_amount, status, created_at')
    .eq('draw_id', drawId)
    .order('match_count', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[winnerService.getWinnersByDraw] ERROR:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status: error.status,
      fullError: JSON.stringify(error, null, 2)
    });
    throw new WinnerServiceError(`Failed to fetch winners by draw: ${error.message}`, 500);
  }

  console.log('[winnerService.getWinnersByDraw] Success', { count: winners?.length || 0 });
  return winners || [];
}

async function getUserWinnings(userId) {
  ensureUuidLike(userId, 'User ID');

  console.log('[winnerService.getUserWinnings] Fetching user winnings', { userId });

  const { data: winnings, error } = await supabase
    .from('winners')
    .select('id, user_id, draw_id, match_count, prize_amount, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[winnerService.getUserWinnings] ERROR:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status: error.status,
      fullError: JSON.stringify(error, null, 2)
    });
    throw new WinnerServiceError(`Failed to fetch user winnings: ${error.message}`, 500);
  }

  console.log('[winnerService.getUserWinnings] Success', { count: winnings?.length || 0 });
  return winnings || [];
}

function canTransitionStatus(currentStatus, requestedStatus) {
  const allowedNext = {
    pending: 'approved',
    approved: 'paid',
    paid: null
  };

  return allowedNext[currentStatus] === requestedStatus;
}

async function verifyWinner(winnerId, status) {
  ensureUuidLike(winnerId, 'Winner ID');

  if (!['approved', 'paid'].includes(status)) {
    throw new WinnerServiceError('Status must be approved or paid', 400);
  }

  const { data: existingWinner, error: fetchError } = await supabase
    .from('winners')
    .select('id, status, prize_amount')
    .eq('id', winnerId)
    .maybeSingle();

  if (fetchError) {
    throw new WinnerServiceError('Failed to fetch winner', 500);
  }

  if (!existingWinner) {
    throw new WinnerServiceError('Winner not found', 404);
  }

  if (!canTransitionStatus(existingWinner.status, status)) {
    throw new WinnerServiceError(
      `Invalid status transition from ${existingWinner.status} to ${status}`,
      400
    );
  }

  if (status === 'paid' && existingWinner.status !== 'approved') {
    throw new WinnerServiceError('Only approved winners can be marked as paid', 400);
  }

  const { data: updatedWinner, error: updateError } = await supabase
    .from('winners')
    .update({ status })
    .eq('id', winnerId)
    .select('id, user_id, draw_id, match_count, prize_amount, status, created_at')
    .single();

  if (updateError) {
    throw new WinnerServiceError('Failed to update winner status', 500);
  }

  return updatedWinner;
}

async function calculatePrizeDistribution(drawId) {
  ensureUuidLike(drawId, 'Draw ID');

  const { data: distributionExists, error: distributionCheckError } = await supabase
    .from('winners')
    .select('id')
    .eq('draw_id', drawId)
    .not('prize_amount', 'is', null)
    .limit(1)
    .maybeSingle();

  if (distributionCheckError) {
    throw new WinnerServiceError('Failed to verify existing prize distribution', 500);
  }

  if (distributionExists) {
    throw new WinnerServiceError('Prize distribution already calculated for this draw', 409);
  }

  const nowIso = new Date().toISOString();

  const { count: activeSubscribersCount, error: activeCountError } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('is_subscribed', true)
    .gt('subscription_end', nowIso);

  if (activeCountError) {
    throw new WinnerServiceError('Failed to count active subscribers', 500);
  }

  const { data: winners, error: winnersError } = await supabase
    .from('winners')
    .select('id, match_count')
    .eq('draw_id', drawId)
    .in('match_count', [3, 4, 5]);

  if (winnersError) {
    throw new WinnerServiceError('Failed to fetch draw winners for distribution', 500);
  }

  if (!winners || winners.length === 0) {
    throw new WinnerServiceError('No winners found for this draw', 404);
  }

  const totalPool = (activeSubscribersCount || 0) * fixedPoolPerSubscriber;

  const winnersByTier = {
    5: winners.filter((winner) => winner.match_count === 5),
    4: winners.filter((winner) => winner.match_count === 4),
    3: winners.filter((winner) => winner.match_count === 3)
  };

  const tierPercentages = {
    5: 0.4,
    4: 0.35,
    3: 0.25
  };

  const distributionSummary = {
    drawId,
    activeSubscribersCount: activeSubscribersCount || 0,
    totalPool,
    tiers: {
      5: { winners: winnersByTier[5].length, perWinner: 0, tierPool: 0 },
      4: { winners: winnersByTier[4].length, perWinner: 0, tierPool: 0 },
      3: { winners: winnersByTier[3].length, perWinner: 0, tierPool: 0 }
    }
  };

  for (const tier of [5, 4, 3]) {
    const tierWinners = winnersByTier[tier];

    if (tierWinners.length === 0) {
      continue;
    }

    const tierPool = Number((totalPool * tierPercentages[tier]).toFixed(2));
    const perWinner = Number((tierPool / tierWinners.length).toFixed(2));

    const { error: updateError } = await supabase
      .from('winners')
      .update({ prize_amount: perWinner })
      .eq('draw_id', drawId)
      .eq('match_count', tier);

    if (updateError) {
      throw new WinnerServiceError(`Failed to update prize amounts for tier ${tier}`, 500);
    }

    distributionSummary.tiers[tier] = {
      winners: tierWinners.length,
      perWinner,
      tierPool
    };
  }

  return distributionSummary;
}

module.exports = {
  getWinnersByDraw,
  getUserWinnings,
  verifyWinner,
  calculatePrizeDistribution,
  WinnerServiceError
};
