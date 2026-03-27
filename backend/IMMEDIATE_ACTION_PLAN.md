# GOLF PLATFORM - IMMEDIATE ACTION PLAN

## 🚨 YOUR PROBLEM SUMMARY

You're getting 500 errors on:
- `GET /api/scores` 
- `POST /api/scores`
- `GET /api/draw/current`
- `GET /api/winners/me`

**Root Cause:** RLS policies are blocking your backend's service role from accessing the database.

---

## ⚡ IMMEDIATE FIX (Do This NOW)

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)

### Step 2: Run This Cleanup (Only if you get errors)
```sql
-- Only needed if policies exist from old setup
DROP POLICY IF EXISTS "Users can view their own scores" ON public.scores;
DROP POLICY IF EXISTS "Users can insert their own scores" ON public.scores;
DROP POLICY IF EXISTS "Users can view their own winnings" ON public.winners;
DROP POLICY IF EXISTS "Draws are publicly readable" ON public.draws;
```

### Step 3: Run The Fixed SQL Setup

Copy the entire file: `backend/FIXED_SQL_SETUP.sql`

Paste it into Supabase SQL Editor and click **Run**

Wait for ✅ **Success** message

---

## ✅ VERIFY IT WORKED

Run this in Supabase SQL Editor:

```sql
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename IN ('scores', 'draws', 'winners')
AND policyname LIKE '%Service%'
ORDER BY tablename;
```

You should see entries like:
- `Service role full access scores` on table `scores`
- `Service role full access winners` on table `winners`
- `Service role manages draws` on table `draws`

If you see these → You fixed the RLS issue! ✅

---

## 🔍 NOW TEST THE BACKEND

### In Terminal (backend folder):
```bash
npm start
```

You should see:
```
[Server] Listening on port 5000
```

### Test with curl (in another terminal):

**1. Signup first:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}'
```

Copy the returned `token` from response

**2. Test GET /api/scores (should work now):**
```bash
curl http://localhost:5000/api/scores \
  -H "Authorization: Bearer PASTE_YOUR_TOKEN_HERE"
```

Expected response:
```json
{
  "success": true,
  "message": "Scores fetched successfully",
  "data": []
}
```

### If it still fails:

**Check terminal logs** - You'll now see detailed error messages like:

```
[scoreService.getUserScores] SUPABASE ERROR DETAILS: {
  message: "...",
  code: "PGRST301",
  details: "..."
}
```

**The error code tells you what's wrong:**
- `PGRST301` = RLS policy blocking
- `42P01` = Table doesn't exist
- `23503` = Foreign key error

---

## 📋 FULL TESTING CHECKLIST

Once backend works:

1. **Subscribe user:**
   ```bash
   curl -X POST http://localhost:5000/api/users/subscribe \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Expected: `202 Accepted` with subscription data

2. **Add a score:**
   ```bash
   curl -X POST http://localhost:5000/api/scores \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"score":25,"date":"2026-03-27"}'
   ```
   Expected: `201 Created` with score data

3. **Check current draw:**
   ```bash
   curl http://localhost:5000/api/draw/current \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Expected: `404` (No draw yet) or `200` with draw data

4. **Check your winnings:**
   ```bash
   curl http://localhost:5000/api/winners/me \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Expected: `200` with empty array `[]`

---

## 🆘 IF YOU STILL GET ERRORS

1. **Check terminal logs** for error details
2. **Note the error code** (e.g., PGRST301, 42P01)
3. **Look up in the error table** at bottom of `TESTING_DEBUG_GUIDE.md`
4. **Verify RLS policies** again using the SQL query above

---

## 📚 REFERENCE DOCUMENTS CREATED FOR YOU

1. **FIXED_SQL_SETUP.sql** - Corrected database schema with proper RLS
2. **TESTING_DEBUG_GUIDE.md** - Complete testing guide with all curl commands
3. **SUPABASE_BEST_PRACTICES.md** - How to properly use Supabase with Node.js

---

## 🎯 WHAT YOU'VE LEARNED

The core issue: Your HTML/SQL setup had policies that blocked your backend's service role.

**Key Takeaway:**
- Backend uses `SUPABASE_SERVICE_KEY` → needs RLS policies allowing `auth.role() = 'service_role'`
- Frontend uses User JWT → needs RLS policies for `auth.uid() = user_id`

---

## ⏱️ EXPECTED TIME TO FIX

- Step 1-3: 5 minutes (Run SQL)
- Verify: 2 minutes (Run SQL check)
- Test Backend: 5 minutes
- **Total: 12 minutes** ⏱️

---

## 🚀 NEXT STEPS (After Fix)

1. Test all 4 failing endpoints
2. Run the full Postman collection
3. Deploy to production (Render)
4. Monitor logs for any issues

---

## 💡 IF YOU NEED HELP

1. Check `TESTING_DEBUG_GUIDE.md` - It has step-by-step instructions
2. Check `SUPABASE_BEST_PRACTICES.md` - It explains the "why" behind each pattern
3. Terminal logs are your friend - They now show detailed Supabase error codes

Good luck! 🎉

