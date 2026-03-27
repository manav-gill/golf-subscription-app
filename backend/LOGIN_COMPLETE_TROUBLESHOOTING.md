# LOGIN TROUBLESHOOTING - COMPLETE GUIDE

## 🎯 QUICK START: 3-STEP FIX

### Step 1: Fix Users Table RLS (Supabase)
**Time: 2 minutes**

1. Go to Supabase Dashboard → SQL Editor
2. Copy entire file: `backend/USERS_TABLE_RLS_FIX.sql`
3. Paste in SQL Editor → Click Run
4. Wait for ✅ Success

---

### Step 2: Add Logging to Backend
**Time: Already done!**

The enhanced logging has been added to `authService.js`.

---

### Step 3: Test Login
**Time: 5 minutes**

Restart backend:
```bash
npm start
```

In new terminal:
```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}'
```

**Check terminal for logs starting with `[LOGIN]`**

---

## 📊 UNDERSTANDING LOGIN FLOW

### Correct Flow (When It Works):

```
Frontend sends login request
    ↓
Express receives POST /api/auth/login
    ↓
authController.login() validates input
    ↓
authService.loginUser() is called
    ↓
[LOGIN] Input normalization: email = 'test@example.com'
    ↓
[LOGIN] Calling Supabase SELECT WHERE email = ?
    ↓
[LOGIN] Database query result: userFound = true, userId = 'xxx'
    ↓
[LOGIN] Password comparison: isValid = true
    ↓
[LOGIN] JWT generated successfully
    ↓
Response with token (200 status)
    ↓
Frontend stores token in localStorage
    ↓
Redirect to dashboard ✅
```

### Broken Flow (When It Fails):

```
Frontend sends login request
    ↓
[LOGIN] Input normalization ✅
    ↓
[LOGIN] ❌ SUPABASE ERROR: PGRST301 (RLS blocking)
    ↓
Response: "RLS policy blocking" (500 status)
    ↓
Frontend shows "Login failed"
    ↓
User cannot proceed ❌
```

---

## 🔍 DEBUGGING BY TERMINAL LOGS

### Log Pattern 1: ✅ Successful Login
```
[LOGIN] ===== LOGIN STARTED =====
[LOGIN] Input normalization: { hasEmail: true, hasPassword: true, ... }
[LOGIN] Calling Supabase: SELECT users WHERE email = ?
[LOGIN] Database query result: { userFound: true, userId: 'abc-123', hasPassword: true, ... }
[LOGIN] ✅ User found, now comparing password
[LOGIN] Password comparison result: { isValid: true, ... }
[LOGIN] ✅ Password valid, generating JWT token
[LOGIN] ✅ LOGIN SUCCESSFUL
```

**Action:** Login worked! Check frontend for token storage.

---

### Log Pattern 2: ❌ RLS Blocking (PGRST301)
```
[LOGIN] ===== LOGIN STARTED =====
[LOGIN] Input normalization: { hasEmail: true, hasPassword: true, ... }
[LOGIN] Calling Supabase: SELECT users WHERE email = ?
[LOGIN] ❌ SUPABASE ERROR: {
  code: "PGRST301",
  message: "new row violates row-level security policy",
  ...
}
```

**Action:** 
1. Run `USERS_TABLE_RLS_FIX.sql` in Supabase
2. Verify RLS policies were created with this SQL:
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'users';
   ```
3. Retry login

---

### Log Pattern 3: ❌ User Not Found
```
[LOGIN] ===== LOGIN STARTED =====
[LOGIN] Input normalization: { hasEmail: true, hasPassword: true, emailValue: 'test@example.com' }
[LOGIN] Calling Supabase: SELECT users WHERE email = ?
[LOGIN] Database query result: { userFound: false, userId: 'NOT_FOUND', ... }
[LOGIN] ❌ User not found in database with email: test@example.com
```

**Action:**
1. Check if user exists in Supabase:
   ```sql
   SELECT * FROM public.users WHERE email = 'test@example.com';
   ```
2. If not found: Create user via signup first
   ```bash
   curl -X POST http://localhost:5000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "name":"Test User",
       "email":"test@example.com",
       "password":"TestPassword123!"
     }'
   ```
3. Then try login again

---

### Log Pattern 4: ❌ Password Mismatch
```
[LOGIN] ===== LOGIN STARTED =====
[LOGIN] Input normalization: { hasEmail: true, hasPassword: true, ... }
[LOGIN] Calling Supabase: SELECT users WHERE email = ?
[LOGIN] Database query result: { userFound: true, userId: 'abc-123', ... }
[LOGIN] ✅ User found, now comparing password
[LOGIN] Password comparison result: { isValid: false, storedHashFormat: '$2a$10$...' }
[LOGIN] ❌ Password does not match
```

**Action:**
1. Check stored password format - should start with `$2a$10$`:
   ```sql
   SELECT email, password FROM public.users 
   WHERE email = 'test@example.com';
   ```
   
2. If password is plaintext (no `$2a$` prefix) → Password was stored wrong
   
3. Recreate the user via signup:
   ```bash
   -- First delete old user
   -- Then signup again
   ```

---

### Log Pattern 5: ❌ Table Not Found (PGRST205)
```
[LOGIN] ❌ SUPABASE ERROR: {
  code: "PGRST205",
  message: "relation \"users\" does not exist"
}
```

**Action:** Create users table in Supabase
```sql
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

## 🧪 MANUAL TESTING IN SUPABASE

### Test 1: Check RLS Policies Exist
```sql
-- Should return 3 rows
SELECT policyname, tablename, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;
```

**Expected Output:**
```
policyname                  | tablename
----------------------------+-----------
Service role manages users  | users
Users read own profile      | users
Users update own profile    | users
```

---

### Test 2: Check Users in Database
```sql
-- List all users with diagnostic info
SELECT 
  id,
  email,
  name,
  password,
  LEFT(password, 10) as password_prefix,
  CASE 
    WHEN password LIKE '$2a$%' THEN '✅ Bcrypt'
    WHEN password LIKE '$2b$%' THEN '✅ Bcrypt'
    ELSE '❌ Not Hashed'
  END as password_format,
  role,
  created_at
FROM public.users
ORDER BY created_at DESC;
```

---

### Test 3: Test Specific User Login
```sql
-- Check if specific user exists and is hashed
SELECT 
  id,
  email,
  password,
  password LIKE '$2a$%' as is_bcrypt
FROM public.users 
WHERE LOWER(email) = 'test@example.com';
```

---

### Test 4: Verify Service Role Can Read
```sql
-- This query should work if RLS is set up correctly
-- (If it fails with PGRST301, RLS is still blocking)
SELECT COUNT(*) as total_users FROM public.users;
```

---

## 🐛 COMMON MISTAKES & FIXES

| Mistake | Symptom | Fix |
|---------|---------|-----|
| RLS policies not created | "RLS policy blocking" (PGRST301) | Run USERS_TABLE_RLS_FIX.sql |
| User doesn't exist | "User not found" | Create user via signup |
| Password stored in plaintext | Password compare fails | Delete user, signup again |
| Email case mismatch | "User not found" | Normalize email in both signup & login ✅ (already done) |
| bcryptjs version too old | Hashing fails | `npm install bcryptjs@latest` |
| JWT_SECRET not set | Token generation fails | Set JWT_SECRET in .env |
| Using anon key instead of service key | RLS blocks everything | Check supabase.js uses SERVICE_KEY ✅ (correct) |
| Password column renamed/missing | "Column password not found" | Check users table schema |

---

## ✅ VERIFICATION CHECKLIST

Before assuming login is fixed:

- [ ] Users table exists in Supabase
- [ ] RLS enabled on users table
- [ ] 3 RLS policies are created ("Service role manages users", "Users read own profile", "Users update own profile")
- [ ] At least one test user exists in database
- [ ] User's password starts with `$2a$10$` or `$2b$10$` (bcrypt format)
- [ ] Terminal shows `[LOGIN]` prefix logs (5+ lines)
- [ ] Login response: Status 200, includes "token" field
- [ ] Frontend stores token in localStorage
- [ ] Subsequent requests include `Authorization: Bearer <token>` header
- [ ] Protected endpoints (like `/api/users/me`) now work

---

## 🚀 IF ALL ELSE FAILS - NUCLEAR OPTION

If login still doesn't work after all fixes:

### Option 1: Clean Slate - Delete & Recreate User
```bash
# 1. Delete test user from Supabase
# In Supabase SQL Editor:
DELETE FROM public.users WHERE email = 'test@example.com';

# 2. Restart backend
npm start

# 3. Signup again
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@example.com",
    "password":"NewPassword123!"
  }'

# 4. Try login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"NewPassword123!"}'
```

### Option 2: Recreate Users Table
```sql
-- WARNING: This deletes all users!
DROP TABLE IF EXISTS public.users CASCADE;

-- Recreate fresh
create extension if not exists "uuid-ossp";

create table public.users (
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

create index idx_users_email on public.users (email);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Service role manages users" ON public.users
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```

---

## 📞 GETTING HELP

**Check logs in this order:**

1. **Frontend console** (`F12` → Console tab)
   - Any JavaScript errors?
   - What error message does frontend show?

2. **Backend terminal** (where `npm start` runs)
   - Does it log `[LOGIN]` messages?
   - What's the exact error code or message?

3. **Supabase SQL Editor**
   - Run diagnostic queries above
   - Check tables, policies, user data

4. **Network tab** (`F12` → Network)
   - What's the actual HTTP response from backend?
   - 200, 400, 401, or 500?

---

## 🎯 FINAL CHECKLIST BEFORE GIVING UP

- [ ] Cleared browser cache & localStorage
- [ ] Restarted backend (`npm start`)
- [ ] Ran USERS_TABLE_RLS_FIX.sql in Supabase
- [ ] Created fresh test user via signup
- [ ] Checked terminal logs for `[LOGIN]` prefix
- [ ] Verified password column starts with `$2a$`
- [ ] Confirmed RLS policies exist in Supabase
- [ ] Tested with exact email/password curl command
- [ ] Checked that email is normalized (lowercase)

If all these are ✅ and still broken → open the files again for deeper analysis.

