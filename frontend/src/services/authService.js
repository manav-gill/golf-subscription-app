import api from './api';

function resolveAuthPath(path) {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '';
  const normalizedBase = baseURL.toLowerCase().replace(/\/+$/, '');

  if (normalizedBase.endsWith('/api')) {
    return `/auth/${path}`;
  }

  return `/api/auth/${path}`;
}

export async function login(data) {
  const url = resolveAuthPath('login');

  console.log('LOGIN REQUEST:', {
    url,
    baseURL: import.meta.env.VITE_API_BASE_URL
  });

  try {
    const response = await api.post(url, data);
    console.log('LOGIN RESPONSE:', response?.data);
    return response;
  } catch (error) {
    console.error('LOGIN ERROR RESPONSE:', error?.response);
    console.error('LOGIN ERROR MESSAGE:', error?.message);
    throw error;
  }
}

export async function signup(data) {
  const url = resolveAuthPath('signup');

  console.log('SIGNUP REQUEST:', {
    url,
    baseURL: import.meta.env.VITE_API_BASE_URL
  });

  try {
    const response = await api.post(url, data);
    console.log('SIGNUP RESPONSE:', response?.data);
    return response;
  } catch (error) {
    console.error('SIGNUP ERROR RESPONSE:', error?.response);
    console.error('SIGNUP ERROR MESSAGE:', error?.message);
    throw error;
  }
}

export async function getProfile() {
  const url = '/users/me';

  console.log('PROFILE REQUEST:', {
    url,
    baseURL: import.meta.env.VITE_API_BASE_URL
  });

  try {
    const response = await api.get(url);
    console.log('PROFILE RESPONSE:', response?.data);
    return response;
  } catch (error) {
    console.error('PROFILE ERROR RESPONSE:', error?.response);
    console.error('PROFILE ERROR MESSAGE:', error?.message);
    throw error;
  }
}
