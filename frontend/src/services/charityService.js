import api from './api';

export async function getCharities() {
  const endpoint = '/charities';
  console.log('CALLING:', endpoint);

  try {
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    console.log('FULL ERROR:', error.response || error.message);
    throw error;
  }
}

export async function getUserCharity() {
  const endpoint = '/users/me';
  console.log('CALLING:', endpoint);

  try {
    const response = await api.get(endpoint);
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
  } catch (error) {
    console.log('FULL ERROR:', error.response || error.message);
    throw error;
  }
}

export async function saveUserCharity(data) {
  const endpoint = '/charities/select';
  console.log('CALLING:', endpoint);

  const payload = {
    charityId: data?.charityId,
    contributionPercentage: data?.percentage
  };

  try {
    const response = await api.post(endpoint, payload);
    return response;
  } catch (error) {
    console.log('FULL ERROR:', error.response || error.message);
    throw error;
  }
}
