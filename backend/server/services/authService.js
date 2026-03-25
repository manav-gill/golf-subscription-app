const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const supabase = require('../config/supabase');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthServiceError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'AuthServiceError';
    this.status = status;
  }
}

function requireJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new AuthServiceError('JWT_SECRET is not configured on the server', 500);
  }

  return process.env.JWT_SECRET;
}

function generateToken(userId, role) {
  const secret = requireJwtSecret();
  return jwt.sign({ userId, role }, secret, { expiresIn: JWT_EXPIRES_IN });
}

async function registerUser(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const rawPassword = String(password || '');

  if (!normalizedEmail || !rawPassword) {
    throw new AuthServiceError('Email and password are required', 400);
  }

  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (findError) {
    throw new AuthServiceError('Failed to verify existing user', 500);
  }

  if (existingUser) {
    throw new AuthServiceError('Email is already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const { data: insertedUser, error: insertError } = await supabase
    .from('users')
    .insert({
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user'
    })
    .select('id, email, role, created_at')
    .single();

  if (insertError) {
    throw new AuthServiceError('Failed to create user', 500);
  }

  const token = generateToken(insertedUser.id, insertedUser.role);

  return {
    token,
    user: insertedUser
  };
}

async function loginUser(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const rawPassword = String(password || '');

  if (!normalizedEmail || !rawPassword) {
    throw new AuthServiceError('Email and password are required', 400);
  }

  const { data: user, error: findError } = await supabase
    .from('users')
    .select('id, email, password, role, created_at')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (findError) {
    throw new AuthServiceError('Failed to fetch user', 500);
  }

  if (!user) {
    throw new AuthServiceError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(rawPassword, user.password);
  if (!isPasswordValid) {
    throw new AuthServiceError('Invalid email or password', 401);
  }

  const token = generateToken(user.id, user.role);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    }
  };
}

module.exports = {
  registerUser,
  loginUser,
  AuthServiceError
};
