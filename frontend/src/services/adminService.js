import api from './api';

export async function runDraw() {
  const endpoint = '/draw/run';
  console.log('CALLING:', endpoint);

  try {
    const response = await api.post(endpoint);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to run draw');
  }
}

export async function getWinners(drawId) {
  let resolvedDrawId = drawId;

  if (!resolvedDrawId) {
    const drawEndpoint = '/draw/current';
    console.log('CALLING:', drawEndpoint);

    try {
      const drawResponse = await api.get(drawEndpoint);
      const draw = drawResponse?.data?.data || null;
      resolvedDrawId = draw?.id;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to resolve current draw');
    }
  }

  if (!resolvedDrawId) {
    return {
      data: {
        success: true,
        data: []
      }
    };
  }

  const endpoint = `/winners/draw/${resolvedDrawId}`;
  console.log('CALLING:', endpoint);

  try {
    const winnersResponse = await api.get(endpoint);
    return winnersResponse;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch winners');
  }
}

export async function addCharity(name) {
  const endpoint = '/charities';
  console.log('CALLING:', endpoint);

  const payload = {
    name
  };

  try {
    const response = await api.post(endpoint, payload);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to create charity');
  }
}
