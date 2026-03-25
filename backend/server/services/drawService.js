const supabase = require('../config/supabase');

class DrawServiceError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'DrawServiceError';
    this.status = status;
  }
}

function generateRandomNumbers() {
  const uniqueNumbers = new Set();

  while (uniqueNumbers.size < 5) {
    uniqueNumbers.add(Math.floor(Math.random() * 45) + 1);
  }

  return Array.from(uniqueNumbers).sort((a, b) => a - b);
}

async function createDraw() {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();

  const { data: existingDraw, error: checkError } = await supabase
    .from('draws')
    .select('id')
    .eq('month', month)
    .eq('year', year)
    .maybeSingle();

  if (checkError) {
    throw new DrawServiceError('Failed to verify monthly draw', 500);
  }

  if (existingDraw) {
    throw new DrawServiceError('A draw already exists for this month', 409);
  }

  const numbers = generateRandomNumbers();

  const { data: createdDraw, error: createError } = await supabase
    .from('draws')
    .insert({
      numbers,
      month,
      year
    })
    .select('id, numbers, month, year, created_at')
    .single();

  if (createError) {
    if (createError.code === '23505') {
      throw new DrawServiceError('A draw already exists for this month', 409);
    }
    throw new DrawServiceError('Failed to create draw', 500);
  }

  return createdDraw;
}

async function getCurrentDraw() {
  const { data: draw, error: drawError } = await supabase
    .from('draws')
    .select('id, numbers, month, year, created_at')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (drawError) {
    throw new DrawServiceError('Failed to fetch current draw', 500);
  }

  if (!draw) {
    return null;
  }

  const { data: winners, error: winnersError } = await supabase
    .from('winners')
    .select('id, user_id, draw_id, match_count, prize_amount, status, created_at')
    .eq('draw_id', draw.id)
    .order('match_count', { ascending: false })
    .order('created_at', { ascending: true });

  if (winnersError) {
    throw new DrawServiceError('Failed to fetch draw winners', 500);
  }

  return {
    ...draw,
    winners: winners || []
  };
}

async function evaluateWinners(drawId) {
  if (!drawId) {
    throw new DrawServiceError('Draw ID is required', 400);
  }

  const { data: draw, error: drawError } = await supabase
    .from('draws')
    .select('id, numbers')
    .eq('id', drawId)
    .maybeSingle();

  if (drawError) {
    throw new DrawServiceError('Failed to fetch draw for evaluation', 500);
  }

  if (!draw) {
    throw new DrawServiceError('Draw not found', 404);
  }

  const drawNumbers = Array.isArray(draw.numbers) ? draw.numbers : [];
  if (drawNumbers.length !== 5) {
    throw new DrawServiceError('Draw numbers are invalid', 500);
  }

  const nowIso = new Date().toISOString();

  const { data: eligibleUsers, error: usersError } = await supabase
    .from('users')
    .select('id')
    .eq('is_subscribed', true)
    .gt('subscription_end', nowIso);

  if (usersError) {
    throw new DrawServiceError('Failed to fetch eligible users', 500);
  }

  const eligibleUserIds = (eligibleUsers || []).map((user) => user.id);

  const { error: clearError } = await supabase
    .from('winners')
    .delete()
    .eq('draw_id', drawId);

  if (clearError) {
    throw new DrawServiceError('Failed to reset draw winners', 500);
  }

  if (eligibleUserIds.length === 0) {
    return {
      drawId,
      winnersCreated: 0,
      tiers: { 3: 0, 4: 0, 5: 0 }
    };
  }

  const { data: scoreRows, error: scoresError } = await supabase
    .from('scores')
    .select('user_id, score, date, created_at')
    .in('user_id', eligibleUserIds)
    .order('user_id', { ascending: true })
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (scoresError) {
    throw new DrawServiceError('Failed to fetch user scores for draw evaluation', 500);
  }

  const scoresByUser = new Map();

  for (const row of scoreRows || []) {
    if (!scoresByUser.has(row.user_id)) {
      scoresByUser.set(row.user_id, []);
    }

    scoresByUser.get(row.user_id).push(Number(row.score));
  }

  const tiers = { 3: 0, 4: 0, 5: 0 };
  const winnerRows = [];

  for (const userId of eligibleUserIds) {
    const userScores = scoresByUser.get(userId) || [];

    if (userScores.length !== 5) {
      continue;
    }

    const userScoreSet = new Set(userScores);
    const matchCount = drawNumbers.filter((num) => userScoreSet.has(num)).length;

    if (matchCount >= 3 && matchCount <= 5) {
      tiers[matchCount] += 1;

      winnerRows.push({
        user_id: userId,
        draw_id: drawId,
        match_count: matchCount,
        prize_amount: null,
        status: 'pending'
      });
    }
  }

  if (winnerRows.length > 0) {
    const { error: insertError } = await supabase
      .from('winners')
      .insert(winnerRows);

    if (insertError) {
      throw new DrawServiceError('Failed to store winners', 500);
    }
  }

  return {
    drawId,
    winnersCreated: winnerRows.length,
    tiers
  };
}

module.exports = {
  generateRandomNumbers,
  createDraw,
  getCurrentDraw,
  evaluateWinners,
  DrawServiceError
};
