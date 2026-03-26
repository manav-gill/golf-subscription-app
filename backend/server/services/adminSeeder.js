const bcrypt = require('bcryptjs');

const supabase = require('../config/supabase');

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD_FALLBACK = 'admin123';
const BCRYPT_SALT_ROUNDS = 10;

class AdminSeederError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'AdminSeederError';
    this.status = status;
  }
}

async function seedAdmin() {
  const { data: existingAdmins, error: findError } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1);

  if (findError) {
    throw new AdminSeederError('Failed to verify existing admin user', 500);
  }

  if (Array.isArray(existingAdmins) && existingAdmins.length > 0) {
    return {
      created: false,
      message: 'Admin user already exists'
    };
  }

  const rawAdminPassword = String(process.env.ADMIN_PASSWORD || ADMIN_PASSWORD_FALLBACK);

  if (!rawAdminPassword.trim()) {
    throw new AdminSeederError('Admin password is missing for seeding', 500);
  }

  const hashedPassword = await bcrypt.hash(rawAdminPassword, BCRYPT_SALT_ROUNDS);

  const { error: insertError } = await supabase
    .from('users')
    .insert({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      is_subscribed: true
    });

  if (insertError) {
    // Handle race conditions where another instance inserts admin concurrently.
    if (insertError.code === '23505') {
      return {
        created: false,
        message: 'Admin user already exists'
      };
    }

    throw new AdminSeederError('Failed to create admin user', 500);
  }

  return {
    created: true,
    message: 'Admin user created successfully'
  };
}

module.exports = {
  seedAdmin,
  AdminSeederError
};