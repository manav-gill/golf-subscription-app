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
  return jwt.sign({ id: userId, role }, secret, { expiresIn: JWT_EXPIRES_IN });
}

async function registerUser(name, email, password) {
  const normalizedName = String(name || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const rawPassword = String(password || '');

  console.log('Signup service step: input normalization complete', {
    hasName: Boolean(normalizedName),
    hasEmail: Boolean(normalizedEmail),
    hasPassword: Boolean(rawPassword)
  });

  if (!normalizedName || !normalizedEmail || !rawPassword) {
    throw new AuthServiceError('Invalid input', 400);
  }

  console.log('Signup service step: checking existing user by email');
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (findError) {
    console.error('Signup service find user error:', findError);

    if (findError.code === 'PGRST205') {
      throw new AuthServiceError('Database error: users table not found. Run users table migration.', 500);
    }

    throw new AuthServiceError(`Database error: ${findError.message}`, 500);
  }

  if (existingUser) {
    throw new AuthServiceError('User already exists', 400);
  }

  console.log('Signup service step: hashing password start');
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  console.log('Signup service step: hashing password complete');

  console.log('Signup service step: database insert start');
  try {
    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          name: normalizedName,
          email: normalizedEmail,
          password: hashedPassword,
          role: 'user'
        }
      ])
      .select('id, name, email, role, created_at')
      .single();

    console.log('Signup service step: database insert response', {
      hasData: Boolean(insertedUser),
      error: insertError || null
    });

    if (insertError) {
      console.error('DB ERROR:', insertError);

      if (insertError.code === '23505') {
        throw new AuthServiceError('User already exists', 400);
      }

      if (insertError.code === 'PGRST205') {
        throw new AuthServiceError('Database error: users table not found. Run users table migration.', 500);
      }

      throw new AuthServiceError(`Database error: ${insertError.message}`, 500);
    }

    console.log('Signup service step: token generation start');
    const token = generateToken(insertedUser.id, insertedUser.role);
    console.log('Signup service step: token generation complete');

    return {
      token,
      user: insertedUser
    };
  } catch (err) {
    console.error('DB ERROR:', err);

    if (err instanceof AuthServiceError) {
      throw err;
    }

    throw new AuthServiceError(`Database error: ${err.message}`, 500);
  }
}

async function loginUser(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const rawPassword = String(password || '');

  console.log('[LOGIN] ===== LOGIN STARTED =====');
  console.log('[LOGIN] Input normalization:', {
    hasEmail: Boolean(normalizedEmail),
    hasPassword: Boolean(rawPassword),
    emailValue: normalizedEmail
  });

  if (!normalizedEmail || !rawPassword) {
    console.error('[LOGIN] Missing email or password');
    throw new AuthServiceError('Email and password are required', 400);
  }

  console.log('[LOGIN] Calling Supabase: SELECT users WHERE email = ?');
  const { data: user, error: findError } = await supabase
    .from('users')
    .select('id, email, password, role, created_at')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (findError) {
    console.error('[LOGIN] ❌ SUPABASE ERROR:', {
      message: findError.message,
      code: findError.code,
      details: findError.details,
      hint: findError.hint,
      fullError: JSON.stringify(findError, null, 2)
    });

    if (findError.code === 'PGRST205') {
      throw new AuthServiceError('Database error: users table not found. Run users table migration.', 500);
    }

    if (findError.code === 'PGRST301') {
      throw new AuthServiceError('RLS policy blocking user lookup. Backend needs service role access to users table. Run USERS_TABLE_RLS_FIX.sql in Supabase.', 500);
    }

    throw new AuthServiceError(`Database error: ${findError.message}`, 500);
  }

  console.log('[LOGIN] Database query result:', {
    userFound: !!user,
    userId: user?.id || 'NOT_FOUND',
    userEmail: user?.email || 'NOT_FOUND',
    hasPassword: !!user?.password,
    passwordLength: user?.password?.length || 0,
    passwordPrefix: user?.password?.substring(0, 15) || 'N/A'
  });

  if (!user) {
    console.error('[LOGIN] ❌ User not found in database with email:', normalizedEmail);
    throw new AuthServiceError('Invalid email or password', 401);
  }

  console.log('[LOGIN] ✅ User found, now comparing password');
  const isPasswordValid = await bcrypt.compare(rawPassword, user.password);
  
  console.log('[LOGIN] Password comparison result:', {
    isValid: isPasswordValid,
    inputPasswordLength: rawPassword.length,
    storedHashLength: user.password.length,
    storedHashFormat: user.password.substring(0, 20)
  });

  if (!isPasswordValid) {
    console.error('[LOGIN] ❌ Password does not match');
    throw new AuthServiceError('Invalid email or password', 401);
  }

  console.log('[LOGIN] ✅ Password valid, generating JWT token');
  const token = generateToken(user.id, user.role);
  console.log('[LOGIN] ✅ LOGIN SUCCESSFUL');

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
