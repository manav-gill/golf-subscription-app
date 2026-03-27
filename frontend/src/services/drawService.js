import api from './api';

import { getMyWinnings } from './winnerService';

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
  const endpoint = '/draw/current';
  console.log('CALLING:', endpoint);

  try {
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    console.log('FULL ERROR:', error.response || error.message);
    throw error;
  }
}

export async function getUserResult() {
  try {
    const [drawResponse, winningsResponse] = await Promise.all([getLatestDraw(), getMyWinnings()]);

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
  } catch (error) {
    console.log('FULL ERROR:', error.response || error.message);
    throw error;
  }
}
