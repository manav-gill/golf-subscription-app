# LOGIN DEBUGGING - ROOT CAUSE ANALYSIS

## 🔍 DIAGNOSIS

Based on your code analysis, I found **3 possible issues** (in order of likelihood):

### Issue #1: ⚠️ MOST LIKELY - RLS Blocking Login Read
**The users table probably has RLS enabled WITHOUT policies allowing the backend service role to SELECT users for login**

```
Backend tries: SELECT * FROM users WHERE email = 'test@example.com'
RLS sees: auth.role() = 'service_role', but no policy allows this
Result: Returns NULL user → "Invalid email or password" ❌
```

### Issue #2: Password Hashing Mismatch
The stored password hash doesn't match bcrypt hash:
- Signup: uses `bcrypt.hash(password, 10)` and stores `hashedPassword`
- Login: uses `bcrypt.compare(password, storedHash)`
- If stored hash is corrupted or plaintext → comparison fails ❌

### Issue #3: Email Case Sensitivity
Database stores `test@example.com` but query looks for `TEST@EXAMPLE.COM`:
- Signup normalizes: `.toLowerCase()` ✅
- Login normalizes: `.toLowerCase()` ✅
- But if old users were created differently → mismatch ❌

---

## ⚡ IMMEDIATE FIX - 3 SIMPLE STEPS

### Step 1: Fix Users Table RLS (Supabase SQL Editor)

Run this SQL:

```sql
-- Enable RLS on users table (if not already)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role manages users" ON public.users;

-- Create policies for users table
-- Allow backend to login (service role reads for auth)
CREATE POLICY "Service role manages users" ON public.users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to read their own profile
CREATE POLICY "Users read own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

**Verify it worked:**

```sql
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename = 'users';
```

Should show:
- `Service role manages users`
- `Users read own profile`
- `Users update own profile`

### Step 2: Check If Users Exist in Database

Run this in Supabase SQL Editor:

```sql
-- Check all users in database
SELECT id, email, name, password FROM public.users;

-- Count total users
SELECT COUNT(*) as total_users FROM public.users;

-- Check if your test user exists
SELECT id, email, name, password FROM public.users 
WHERE email = 'test@example.com';
```

**Expected result:**
- Some users should exist
- Password column should have values like: `$2a$10$...` (bcrypt hash starting with $2a$)
- NOT plain text passwords

---

### Step 3: Test Login with Backend Logs

1. **Restart backend to pick up RLS changes:**
   ```bash
   npm start
   ```

2. **In new terminal, try login:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"yourpassword"}'
   ```

3. **Check terminal logs** for detailed errors:
   ```
   Login service step: input normalization complete
   Login service step: fetching user by email
   Login service step: password compare complete
   Login service step: token generation complete
   ```

---

## 🔧 DETAILED DEBUGGING BY SCENARIO

### Scenario A: "User not found" (user is NULL)

**Symptoms:**
- Terminal logs: `Login service step: fetching user by email` → `Database query returned null`
- User exists in Supabase but query returns nothing

**Causes & Fixes:**

1. **RLS blocking the SELECT:**
   ```
   Fix: Run Step 1 SQL above (add service role policies)
   ```

2. **User doesn't actually exist:**
   ```
   Fix: Create a test user via signup first
   curl -X POST http://localhost:5000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "name":"Test User",
       "email":"test@example.com",
       "password":"TestPassword123"
     }'
   ```

3. **Email case mismatch:**
   ```
   Check: Does Supabase have user with different case?
   Run: SELECT * FROM users WHERE LOWER(email) = 'test@example.com'
   If found: Run update to fix
     UPDATE users SET email = 'test@example.com' WHERE email = 'TEST@EXAMPLE.COM'
   ```

---

### Scenario B: "Invalid password" (password compare fails)

**Symptoms:**
- Terminal logs show: user found, but password compare fails
- `isPasswordValid = false`

**Causes & Fixes:**

1. **Password stored as plaintext (not hashed):**
   ```sql
   -- Check if any passwords are plaintext (don't start with $2a$ or $2b$)
   SELECT id, email, password FROM users 
   WHERE password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%';
   
   -- If found, rehash them:
   -- Option 1: Delete users and recreate via signup
   DELETE FROM users WHERE password NOT LIKE '$2a$%';
   
   -- Option 2: Use this script (in Node.js terminal):
   const bcrypt = require('bcryptjs');
   const plainPassword = 'old_password';
   const hashed = bcrypt.hashSync(plainPassword, 10);
   console.log(hashed);
   -- Then manually update in Supabase with the output
   ```

2. **Bcrypt version mismatch:**
   ```bash
   # Check your bcryptjs version
   npm list bcryptjs
   
   # Should be >=4.0.0
   # If older, update it:
   npm install bcryptjs@latest
   ```

3. **Password never hashed during signup:**
   ```
   Fix: The code uses bcrypt.hash() ✅ (you're doing this right)
   Verify: Create new user with signup and it should work
   ```

---

### Scenario C: Database error "PGRST205" (Table not found)

**Symptoms:**
- Terminal: `Database error: relation "users" does not exist`

**Causes & Fixes:**

1. **Users table not created:**
   ```sql
   -- Run this in Supabase SQL Editor
   create extension if not exists "uuid-ossp";
   
   create table if not exists public.users (
     id uuid primary key default uuid_generate_v4(),
     name text not null,
     email text not null unique,
     password text not null,
     role text not null default 'user' check (role in ('user', 'admin')),
     is_subscribed boolean not null default false,
     subscription_start timestamptz,
     subscription_end timestamptz,
     charity_id uuid,
     contribution_percentage numeric,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now(),
     constraint users_contribution_percentage_check
       check (contribution_percentage is null or contribution_percentage >= 10)
   );
   
   create index if not exists idx_users_email on public.users (email);
   ```

---

## 🎯 STEP-BY-STEP DEBUGGING FLOW

### Flow: Debug Login Failure

```
1. START: Try login
   ↓
2. CHECK: Terminal logs - what step fails?
   ├─ "user is NULL" → Go to Scenario A
   ├─ "password compare fails" → Go to Scenario B
   ├─ "table not found" → Go to Scenario C
   ├─ "RLS policy blocking" → Run Step 1 SQL
   └─ Successful ✅ → Login works!
   
3. VERIFY: User exists in Supabase
   ├─ Run: SELECT * FROM users;
   ├─ If nothing: Create user via signup
   └─ If exists: Check password column
   
4. CHECK: Password format
   ├─ Starts with $2a$ or $2b$ → Hashed ✅
   ├─ Looks like plaintext → Go to Scenario B
   
5. RETRY: After each fix, test again
```

---

## 📝 ADD DETAILED LOGGING TO IDENTIFY ISSUE

Update `authService.js` login function with more logging:

```javascript
async function loginUser(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const rawPassword = String(password || '');

  console.log('[LOGIN] Input normalization:', {
    hasEmail: Boolean(normalizedEmail),
    hasPassword: Boolean(rawPassword),
    emailValue: normalizedEmail  // Log the actual email for verification
  });

  if (!normalizedEmail || !rawPassword) {
    throw new AuthServiceError('Email and password are required', 400);
  }

  console.log('[LOGIN] Fetching user from database');
  const { data: user, error: findError } = await supabase
    .from('users')
    .select('id, email, password, role, created_at')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (findError) {
    console.error('[LOGIN] Database error:', {
      message: findError.message,
      code: findError.code,
      details: findError.details,
      hint: findError.hint
    });

    if (findError.code === 'PGRST205') {
      throw new AuthServiceError('Users table not found', 500);
    }
    if (findError.code === 'PGRST301') {
      throw new AuthServiceError('RLS policy blocking user lookup. Backend needs service role access to users table.', 500);
    }
    throw new AuthServiceError(`Database error: ${findError.message}`, 500);
  }

  console.log('[LOGIN] Database query result:', {
    userFound: !!user,
    userId: user?.id || 'N/A',
    userEmail: user?.email || 'N/A',
    hasPassword: !!user?.password,
    passwordLength: user?.password?.length || 0,
    passwordPrefix: user?.password?.substring(0, 10) || 'N/A'  // Show first 10 chars
  });

  if (!user) {
    console.log('[LOGIN] User not found');
    throw new AuthServiceError('Invalid email or password', 401);
  }

  console.log('[LOGIN] Starting bcrypt compare');
  const isPasswordValid = await bcrypt.compare(rawPassword, user.password);
  
  console.log('[LOGIN] Password comparison result:', {
    isValid: isPasswordValid,
    inputPasswordLength: rawPassword.length,
    storedHashLength: user.password.length,
    storedHashFormat: user.password.substring(0, 20)  // Show if it's bcrypt format
  });

  if (!isPasswordValid) {
    console.log('[LOGIN] Password does not match');
    throw new AuthServiceError('Invalid email or password', 401);
  }

  console.log('[LOGIN] Generating JWT token');
  const token = generateToken(user.id, user.role);

  console.log('[LOGIN] Success - returning token');
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
```

---

## ✅ VERIFICATION CHECKLIST

After applying fixes:

- [ ] Users table exists in Supabase
- [ ] RLS is enabled on users table
- [ ] Service role policies allow backend SELECT
- [ ] At least one test user exists
- [ ] Passwords start with `$2a$10$` (bcrypt format)
- [ ] Terminal logs show detailed steps
- [ ] Login request returns 200 status
- [ ] Response includes valid JWT token
- [ ] No "RLS policy" errors in logs
- [ ] Frontend receives token and stores in localStorage

---

## 🚀 QUICK REFERENCE

| Issue | Error Message | Fix |
|-------|---------------|-----|
| RLS blocking | "RLS policy blocking" (PGRST301) | Run Step 1 SQL |
| User not found | User is NULL | Create user via signup or verify it exists |
| Password mismatch | Password compare fails | Check password is hashed (starts with $2a$) |
| Table missing | "relation users does not exist" | Create users table SQL |
| No error logs | Can't see what's wrong | Update authService.js with logging above |

---

## 🔗 NEXT ACTIONS

1. **Run Step 1 SQL** in Supabase to fix RLS
2. **Check users exist** in database
3. **Add logging** to authService.js
4. **Test login** and check terminal output
5. **Debug based on error** using scenarios above

