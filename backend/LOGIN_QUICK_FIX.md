# LOGIN FIX - IMMEDIATE ACTION PLAN

## ⏱️ Expected Time: 15 minutes

---

## 🔴 STEP 1: Fix Users Table RLS (3 minutes)

### In Supabase Dashboard:

1. Click **SQL Editor** (left sidebar)
2. Paste entire content of: `backend/USERS_TABLE_RLS_FIX.sql`
3. Click **Run**
4. Wait for ✅ **Success**

**Verify it worked:**

Run this SQL:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'users';
```

Should see:
- ✅ `Service role manages users`
- ✅ `Users read own profile`
- ✅ `Users update own profile`

---

## 🟡 STEP 2: Restart Backend & Check Logs (2 minutes)

### Terminal 1: Restart backend
```bash
# Kill current process (Ctrl+C)
# Then restart:
npm start
```

**You should see:**
```
[Server] Listening on port 5000
[Server] Environment loaded
```

---

## 🟢 STEP 3: Test Login (5 minutes)

### Terminal 2: First, create a test user

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "abc-123",
      "email": "test@example.com",
      "role": "user"
    }
  }
}
```

**Check Terminal 1 logs** - should see signup logs

---

### Now test login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "abc-123",
      "email": "test@example.com",
      "role": "user",
      "created_at": "2026-03-27T..."
    }
  }
}
```

**Check Terminal 1** - should see detailed login logs starting with `[LOGIN]`:

```
[LOGIN] ===== LOGIN STARTED =====
[LOGIN] Input normalization: { hasEmail: true, ... }
[LOGIN] Calling Supabase: SELECT users WHERE email = ?
[LOGIN] Database query result: { userFound: true, ... }
[LOGIN] ✅ User found, now comparing password
[LOGIN] Password comparison result: { isValid: true, ... }
[LOGIN] ✅ Password valid, generating JWT token
[LOGIN] ✅ LOGIN SUCCESSFUL
```

✅ **If you see this, login is FIXED!**

---

## ❌ IF LOGIN STILL FAILS

### Check Terminal 1 Output

**If you see:**
```
[LOGIN] ❌ SUPABASE ERROR: { code: "PGRST301" ... }
```
→ RLS still blocking. Re-run Step 1 SQL.

**If you see:**
```
[LOGIN] ❌ User not found in database
```
→ User doesn't exist (or email mismatch). Create via signup first.

**If you see:**
```
[LOGIN] ❌ Password does not match
```
→ Password hash mismatch. Delete user and signup again.

---

## 🧪 OPTIONAL: Manual Supabase Check

If you want to verify database state directly:

```sql
-- Check RLS policies
SELECT policyname FROM pg_policies WHERE tablename = 'users';

-- Check users table exists
SELECT COUNT(*) as total_users FROM public.users;

-- Check specific user
SELECT id, email, password, LEFT(password, 15) as hash_start 
FROM public.users WHERE email = 'test@example.com';
```

---

## 📱 Test Frontend Login (After Backend Works)

1. Go to http://localhost:5173 (or your frontend URL)
2. Click "Login" button
3. Enter: `test@example.com` and `TestPassword123`
4. Should redirect to dashboard ✅
5. Check browser console (`F12`) - token should be in localStorage

---

## ✅ YOU'RE DONE WHEN:

- ✅ Backend logs show `[LOGIN] ✅ LOGIN SUCCESSFUL`
- ✅ Login response includes a token (starts with `eyJh...`)
- ✅ Frontend redirects to dashboard
- ✅ `Authorization: Bearer <token>` header sent on protected routes
- ✅ Frontend localStorage has authToken key

---

## 📚 REFERENCE DOCS IF YOU GET STUCK

- **Enhanced logs not appearing?** → Check `LOGIN_DEBUGGING_GUIDE.md`
- **Specific error code?** → Check `LOGIN_COMPLETE_TROUBLESHOOTING.md`
- **Step by step explanation?** → Read the debugging guide
- **Manual SQL to test?** → Check the `.sql` files

---

## 🎯 MOST COMMON FIX (happens 90% of the time)

**The users table RLS was blocking backend SELECT queries.**

**Solution: Run USERS_TABLE_RLS_FIX.sql**

That's it. 

Restart backend, test login.

Done. ✅

---

**Start with Step 1. Let me know if you hit any issues!**

