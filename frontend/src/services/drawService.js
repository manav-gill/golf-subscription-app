import api from './api';

function getResultStatus(matchCount) {
  if (matchCount === 5) {
    return 'Jackpot';
  }

  if (matchCount === 4) {
    return 'Medium Win';
  }

  if (matchCount === 3) {
    return 'Small Win';
  }

  return 'No Win';
}

export async function getLatestDraw() {
  // Backend route: GET /draw/current
  const response = await api.get('/draw/current');
  return response;
}

export async function getUserResult() {
  // Backend does not expose /draw/result. Use winners + current draw to derive the latest draw result.
  const [drawResponse, winningsResponse] = await Promise.all([api.get('/draw/current'), api.get('/winners/me')]);

  const currentDraw = drawResponse?.data?.data || null;
  const winnings = winningsResponse?.data?.data || [];

  const winnerForCurrentDraw = winnings.find(winner => winner?.draw_id === currentDraw?.id) || null;

  const matches = winnerForCurrentDraw?.match_count || 0;
  const prizeAmount = winnerForCurrentDraw?.prize_amount || 0;

  return {
    data: {
      success: true,
      data: {
        matches,
        reward: prizeAmount,
        status: getResultStatus(matches)
      }
    }
  };
}
