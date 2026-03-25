const supabase = require('../config/supabase');

class CharityServiceError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'CharityServiceError';
    this.status = status;
  }
}

function validateCharityPayload(data, { allowPartial = false } = {}) {
  if (!data || typeof data !== 'object') {
    throw new CharityServiceError('Invalid charity payload', 400);
  }

  const payload = {};

  if (!allowPartial || Object.prototype.hasOwnProperty.call(data, 'name')) {
    const name = String(data.name || '').trim();
    if (!name) {
      throw new CharityServiceError('Charity name is required', 400);
    }
    payload.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(data, 'description')) {
    const description = data.description;
    if (description !== null && typeof description !== 'string') {
      throw new CharityServiceError('description must be a string or null', 400);
    }
    payload.description = description === null ? null : description.trim();
  }

  if (Object.prototype.hasOwnProperty.call(data, 'image_url')) {
    const imageUrl = data.image_url;
    if (imageUrl !== null && typeof imageUrl !== 'string') {
      throw new CharityServiceError('image_url must be a string or null', 400);
    }
    payload.image_url = imageUrl === null ? null : imageUrl.trim();
  }

  if (allowPartial && Object.keys(payload).length === 0) {
    throw new CharityServiceError('At least one charity field must be provided', 400);
  }

  return payload;
}

async function getAllCharities() {
  const { data, error } = await supabase
    .from('charities')
    .select('id, name, description, image_url, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new CharityServiceError('Failed to fetch charities', 500);
  }

  return data || [];
}

async function getCharityById(charityId) {
  if (!charityId) {
    throw new CharityServiceError('Charity ID is required', 400);
  }

  const { data, error } = await supabase
    .from('charities')
    .select('id, name, description, image_url, created_at')
    .eq('id', charityId)
    .maybeSingle();

  if (error) {
    throw new CharityServiceError('Failed to fetch charity', 500);
  }

  if (!data) {
    throw new CharityServiceError('Charity not found', 404);
  }

  return data;
}

async function createCharity(data) {
  const payload = validateCharityPayload(data);

  const { data: created, error } = await supabase
    .from('charities')
    .insert(payload)
    .select('id, name, description, image_url, created_at')
    .single();

  if (error) {
    throw new CharityServiceError('Failed to create charity', 500);
  }

  return created;
}

async function updateCharity(charityId, data) {
  if (!charityId) {
    throw new CharityServiceError('Charity ID is required', 400);
  }

  const payload = validateCharityPayload(data, { allowPartial: true });

  const { data: updated, error } = await supabase
    .from('charities')
    .update(payload)
    .eq('id', charityId)
    .select('id, name, description, image_url, created_at')
    .maybeSingle();

  if (error) {
    throw new CharityServiceError('Failed to update charity', 500);
  }

  if (!updated) {
    throw new CharityServiceError('Charity not found', 404);
  }

  return updated;
}

async function deleteCharity(charityId) {
  if (!charityId) {
    throw new CharityServiceError('Charity ID is required', 400);
  }

  const { data: deleted, error } = await supabase
    .from('charities')
    .delete()
    .eq('id', charityId)
    .select('id, name, description, image_url, created_at')
    .maybeSingle();

  if (error) {
    throw new CharityServiceError('Failed to delete charity', 500);
  }

  if (!deleted) {
    throw new CharityServiceError('Charity not found', 404);
  }

  return deleted;
}

async function selectUserCharity(userId, charityId, contributionPercentage) {
  if (!userId) {
    throw new CharityServiceError('User ID is required', 400);
  }

  if (!charityId) {
    throw new CharityServiceError('charityId is required', 400);
  }

  const parsedContribution = Number(contributionPercentage);
  if (!Number.isInteger(parsedContribution) || parsedContribution < 10) {
    throw new CharityServiceError('contributionPercentage must be an integer greater than or equal to 10', 400);
  }

  const { data: charity, error: charityError } = await supabase
    .from('charities')
    .select('id')
    .eq('id', charityId)
    .maybeSingle();

  if (charityError) {
    throw new CharityServiceError('Failed to validate charity selection', 500);
  }

  if (!charity) {
    throw new CharityServiceError('Selected charity does not exist', 404);
  }

  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({
      charity_id: charityId,
      contribution_percentage: parsedContribution
    })
    .eq('id', userId)
    .select('id, email, charity_id, contribution_percentage, created_at')
    .maybeSingle();

  if (updateError) {
    throw new CharityServiceError('Failed to save user charity selection', 500);
  }

  if (!updatedUser) {
    throw new CharityServiceError('User not found', 404);
  }

  return updatedUser;
}

module.exports = {
  getAllCharities,
  getCharityById,
  createCharity,
  updateCharity,
  deleteCharity,
  selectUserCharity,
  CharityServiceError
};
