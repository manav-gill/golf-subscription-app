import api from './api';

export async function login(data) {
  const endpoint = '/auth/login';
  console.log('CALLING:', endpoint);

  try {
    const response = await api.post(endpoint, data);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function signup(data) {
  const endpoint = '/auth/signup';
  console.log('CALLING:', endpoint);

  try {
    const response = await api.post(endpoint, data);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getProfile() {
  const endpoint = '/users/me';
  console.log('CALLING:', endpoint);

  try {
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    throw error;
  }
}
