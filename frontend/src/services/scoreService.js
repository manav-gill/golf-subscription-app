import api from './api';

export async function getScores() {
  const endpoint = '/scores';
  console.log('CALLING:', endpoint);

  try {
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    console.log('FULL ERROR:', error.response || error.message);
    throw error;
  }
}

export async function addScore(value) {
  const endpoint = '/scores';
  console.log('CALLING:', endpoint);

  const payload = {
    score: value,
    date: new Date().toISOString().split('T')[0]
  };

  try {
    const response = await api.post(endpoint, payload);
    return response;
  } catch (error) {
    console.log('FULL ERROR:', error.response || error.message);
    throw error;
  }
}
