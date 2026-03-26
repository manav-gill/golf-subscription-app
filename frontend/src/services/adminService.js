import api from './api';

export async function runDraw() {
  // Backend route: POST /draw/run (admin only)
  const response = await api.post('/draw/run');
  return response;
}

export async function getWinners() {
  // Backend exposes winners by draw id, so fetch current draw first.
  const drawResponse = await api.get('/draw/current');
  const draw = drawResponse?.data?.data || null;

  if (!draw?.id) {
    return {
      data: {
        success: true,
        data: []
      }
    };
  }

  const winnersResponse = await api.get(`/winners/draw/${draw.id}`);
  return winnersResponse;
}

export async function addCharity(name) {
  const payload = {
    name
  };

  const response = await api.post('/charities', payload);
  return response;
}
