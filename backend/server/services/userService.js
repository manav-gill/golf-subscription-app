const supabase = require('../config/supabase');

class UserServiceError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'UserServiceError';
    this.status = status;
  }
}

const restrictedFields = ['role', 'is_subscribed', 'subscription_start', 'subscription_end'];
const allowedFields = ['email'];

async function getUserById(userId) {
  if (!userId) {
    throw new UserServiceError('User ID is required', 400);
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  console.log('DB DATA:', user);
  console.log('DB ERROR:', error);

  if (error) {
    throw new UserServiceError(error.message, 500);
  }

  if (!user) {
    throw new UserServiceError('User not found', 404);
  }

  return user;
}

async function updateUser(userId, updates) {
  if (!userId) {
    throw new UserServiceError('User ID is required', 400);
  }

  if (!updates || Object.keys(updates).length === 0) {
    throw new UserServiceError('No update fields were provided', 400);
  }

  const payloadKeys = Object.keys(updates);

  const attemptedRestricted = payloadKeys.filter((key) => restrictedFields.includes(key));
  if (attemptedRestricted.length > 0) {
    throw new UserServiceError(
      `Restricted fields cannot be updated: ${attemptedRestricted.join(', ')}`,
      400
    );
  }

  const attemptedUnknown = payloadKeys.filter((key) => !allowedFields.includes(key));
  if (attemptedUnknown.length > 0) {
    throw new UserServiceError(
      `Unknown fields are not allowed: ${attemptedUnknown.join(', ')}`,
      400
    );
  }

  const updatePayload = {};

  if (Object.prototype.hasOwnProperty.call(updates, 'email')) {
    const normalizedEmail = String(updates.email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new UserServiceError('Email cannot be empty', 400);
    }
    updatePayload.email = normalizedEmail;
  }

  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('id', userId)
    .select('id, email, role, is_subscribed, subscription_start, subscription_end, created_at')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      throw new UserServiceError('Email is already in use', 409);
    }
    throw new UserServiceError('Failed to update user profile', 500);
  }

  if (!updatedUser) {
    throw new UserServiceError('User not found', 404);
  }

  return updatedUser;
}

async function activateSubscription(userId) {
  if (!userId) {
    throw new UserServiceError('User ID is required', 400);
  }

  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({
      is_subscribed: true,
      subscription_start: now.toISOString(),
      subscription_end: endDate.toISOString()
    })
    .eq('id', userId)
    .select('id, email, role, is_subscribed, subscription_start, subscription_end, created_at')
    .maybeSingle();

  if (error) {
    throw new UserServiceError('Failed to activate subscription', 500);
  }

  if (!updatedUser) {
    throw new UserServiceError('User not found', 404);
  }

  return updatedUser;
}

module.exports = {
  getUserById,
  updateUser,
  activateSubscription,
  UserServiceError
};
