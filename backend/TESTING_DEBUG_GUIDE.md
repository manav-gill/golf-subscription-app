
# COMPLETE TESTING GUIDE FOR GOLF PLATFORM

## STEP 1: VERIFY DATABASE SETUP (DO THIS FIRST!)

### 1A. Check Tables Exist
Go to: Supabase Dashboard → SQL Editor → Run this query:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

#### Expected Result:
```
table_name
-----------
auth.users
charities
draws
scores
users
winners
```

If you DON'T see `scores`, `draws`, `winners` → **Run FIXED_SQL_SETUP.sql immediately**

---

### 1B. Check Rows Level Security (RLS) is Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('scores', 'draws', 'winners', 'charities') 
AND schemaname = 'public';
```

#### Expected Result:
```
tablename | rowsecurity
-----------+----------
scores    | t
draws     | t
winners   | t
charities | t
```

All should show `t` (true). If any show `f` (false), run:
```sql
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
```

---

### 1C. Check RLS Policies Exist
```sql
SELECT policyname, tablename, cmd 
FROM pg_policies 
WHERE tablename IN ('scores', 'draws', 'winners', 'charities') 
AND schemaname = 'public'
ORDER BY tablename, policyname;
```

#### Expected Result (You should see policies like):
```
policyname                          | tablename | cmd
------------------------------------+-----------+-----
Service role full access scores     | scores    | ALL
Service role full access winners    | winners   | ALL
Service role manages charities      | charities | ALL
Service role manages draws          | draws     | ALL
Users insert own scores             | scores    | INSERT
Users read own scores               | scores    | SELECT
Users read own winners              | winners   | SELECT
... (and Charities, Draws public read)
```

If you DON'T see "Service role full access" policies → **Run FIXED_SQL_SETUP.sql**

---

### 1D. Check Column Structure for Scores Table
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scores'
ORDER BY ordinal_position;
```

#### Expected Result:
```
column_name | data_type                  | is_nullable
-------------+----------------------------+----------
id          | uuid                       | NO
user_id     | uuid                       | NO
score       | integer                    | NO
date        | date                       | NO
created_at  | timestamp with time zone   | NO
```

---

## STEP 2: BACKEND LOGGING VERIFICATION

### 2A. Start Backend with Enhanced Logging

Open your terminal in the `backend` folder:

```bash
npm start
```

You should see:
```
[Server] Listening on port 5000
[Server] Environment loaded: SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET
```

---

### 2B. Test GET /api/scores (No Auth Yet)

Using **Postman** or **curl**:

```bash
curl http://localhost:5000/api/scores
```

#### Expected Result:
```json
{
  "success": false,
  "message": "Authorization header missing"
}
```

---

### 2C. Test With Auth Token

First, signup to get a token:

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@gmail.com",
    "password": "Test@1234"
  }'
```

#### Expected Response:
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "uuid-here", "email": "testuser@gmail.com", "role": "user" }
  }
}
```

**Copy the token!** (You'll use this for next tests)

---

### 2D. Test GET /api/scores With Token

```bash
curl http://localhost:5000/api/scores \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Expected Results:

**If successful:**
```json
{
  "success": true,
  "message": "Scores fetched successfully",
  "data": []
}
```

**If RLS is still blocking (PROBLEM):**
```json
{
  "success": false,
  "message": "Failed to fetch user scores: new row violates row-level security policy for table \"scores\""
}
```

**Terminal logs should show:**
```
[scoreService.getUserScores] Attempting to fetch scores { userId: 'xxx' }
[scoreService.getUserScores] SUPABASE ERROR DETAILS: {
  message: "new row violates row-level security policy for table \"scores\"",
  code: "PGRST301",
  details: "...",
  ...
}
```

If you see this → **Re-run FIXED_SQL_SETUP.sql** and make sure service role policies were created

---

### 2E. Test POST /api/scores (Add a Score)

First, subscribe the user (dummy subscription):

```bash
curl -X POST http://localhost:5000/api/users/subscribe \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected:
```json
{
  "success": true,
  "message": "Subscription activated",
  "data": { "is_subscribed": true, "subscription_start": "2026-03-27T...", "subscription_end": "2026-04-26T..." }
}
```

Then add a score:

```bash
curl -X POST http://localhost:5000/api/scores \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 25,
    "date": "2026-03-27"
  }'
```

#### Expected Result:
```json
{
  "success": true,
  "message": "Score added successfully",
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "score": 25,
      "date": "2026-03-27",
      "created_at": "2026-03-27T..."
    }
  ]
}
```

**Terminal logs should show:**
```
[scoreService.addScore] route hit { method: 'POST', path: '/api/scores', userId: 'xxx', body: { score: 25, date: '2026-03-27' } }
[scoreService.addScore] Validating subscription { userId: 'xxx', ... }
[scoreService.addScore] Attempting to insert score { userId: 'xxx', parsedScore: 25, parsedDate: '2026-03-27' }
[scoreService.addScore] Insert successful, fetching all scores...
[scoreService.getUserScores] Attempting to fetch scores { userId: 'xxx' }
[scoreService.getUserScores] Success { count: 1 }
```

---

### 2F. Test GET /api/draw/current

```bash
curl http://localhost:5000/api/draw/current \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Expected Result (No draw yet):
```json
{
  "success": false,
  "message": "No draw found"
}
```

**Terminal logs should show:**
```
[drawService.getCurrentDraw] Fetching most recent draw
[drawService.getCurrentDraw] No draw found (this is OK if no draws exist yet)
```

---

### 2G. Test GET /api/winners/me

```bash
curl http://localhost:5000/api/winners/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Expected Result (No winners yet):
```json
{
  "success": true,
  "message": "User winnings fetched successfully",
  "data": []
}
```

**Terminal logs should show:**
```
[winnerService.getUserWinnings] Fetching user winnings { userId: 'xxx' }
[winnerService.getUserWinnings] Success { count: 0 }
```

---

## STEP 3: FULL WORKFLOW TEST

### 3A. Create Test Admin & User

```bash
# Signup as test admin
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin.test@gmail.com",
    "password": "AdminTest@123"
  }'

# Manually promote to admin in Supabase (in users table, set role='admin')
# Or wait for admin seeder to create admin@gmail.com
```

---

### 3B. Test Draw Workflow

1. Subscribe user (from Step 2E)
2. Add 5 scores:

```bash
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/scores \
    -H "Authorization: Bearer YOUR_TOKEN_HERE" \
    -H "Content-Type: application/json" \
    -d "{ \"score\": $((20 + i)), \"date\": \"2026-03-2$i\" }"
done
```

3. Run draw (admin only):

```bash
curl -X POST http://localhost:5000/api/draw/run \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

Expected:
```json
{
  "success": true,
  "message": "Draw executed successfully",
  "data": {
    "draw": { "id": "...", "numbers": [1, 15, 23, 32, 44], ... },
    "summary": { "drawId": "...", "winnersCreated": 0, "tiers": { 3: 0, 4: 0, 5: 0 } }
  }
}
```

---

## STEP 4: COMMON ERROR TROUBLESHOOTING

| Error | Cause | Fix |
|-------|-------|-----|
| `new row violates row-level security policy` | RLS blocking backend | Run FIXED_SQL_SETUP.sql |
| `relation "scores" does not exist` | Table not created | Run FIXED_SQL_SETUP.sql |
| `column "user_id" does not exist` | Schema mismatch | Check table structure SQL |
| `Failed to create draw: ...` | Database constraint violated | Check logs for details |
| `User not found` | JWT token has wrong userId | Check auth middleware resolves userId correctly |

---

## STEP 5: POSTMAN COLLECTION SETUP

Import the Postman collection included in your repo:
- File: `backend/Golf-Charity-Subscription-Platform.postman_collection.json`
- Set variables in Postman:
  - `baseUrl`: `http://localhost:5000`
  - `authToken`: Paste your JWT from signup response
  - `adminToken`: Paste admin JWT

---

## STEP 6: VERIFICATION CHECKLIST

✅ Tables exist in Supabase  
✅ RLS policies enabled  
✅ Backend starts without errors  
✅ GET /health returns 200  
✅ Signup/login works  
✅ GET /api/scores returns 200 (with token)  
✅ POST /api/scores returns 201 (after subscribe)  
✅ GET /api/draw/current returns 200 or 404  
✅ GET /api/winners/me returns 200  
✅ Terminal shows detailed Supabase logs  

If **all checks pass** → Your backend is working! 🎉

---

## DEBUGGING QUICK REFERENCE

### If a query fails:
1. Check terminal logs for `ERROR DETAILS` message
2. Note the error `code` (e.g., "PGRST301" = RLS block)
3. Check RLS policies in Supabase
4. Check table structure matches expected schema

### To test Supabase directly:
Go to Supabase SQL Editor and test queries:

```sql
-- Test scores insert
INSERT INTO public.scores (user_id, score, date) 
VALUES ('your-user-uuid', 25, '2026-03-27');

-- Test scores select
SELECT * FROM public.scores WHERE user_id = 'your-user-uuid';

-- Test draws insert
INSERT INTO public.draws (numbers, month, year) 
VALUES (ARRAY[1, 15, 23, 32, 44], 3, 2026);

-- Check winners table
SELECT * FROM public.winners;
```

If these work in Supabase but fail in your backend → **It's an RLS policy issue**

