import api from './api';

export async function getScores() {
  const response = await api.get('/scores');
  return response;
}

export async function addScore(value) {
  // Backend currently validates both score and date.
  const payload = {
    score: value,
    date: new Date().toISOString().split('T')[0]
  };

  const response = await api.post('/scores', payload);
  return response;
}
