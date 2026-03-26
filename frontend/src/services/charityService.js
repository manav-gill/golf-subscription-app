import api from './api';

export async function getCharities() {
  const response = await api.get('/charities');
  return response;
}

export async function getUserCharity() {
  // Backend currently exposes user profile at /users/me.
  const response = await api.get('/users/me');

  const profile = response?.data?.data || null;

  return {
    ...response,
    data: {
      ...response.data,
      data: profile
        ? {
            charityId: profile.charity_id || null,
            contributionPercentage: profile.contribution_percentage ?? null
          }
        : null
    }
  };
}

export async function saveUserCharity(data) {
  const payload = {
    charityId: data?.charityId,
    contributionPercentage: data?.percentage
  };

  const response = await api.post('/charities/select', payload);
  return response;
}
