import api from './api';

export async function getMyWinnings() {
  const endpoint = '/winners/me';
  console.log('CALLING:', endpoint);

  try {
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    console.log('FULL ERROR:', error.response || error.message);
    throw error;
  }
}
