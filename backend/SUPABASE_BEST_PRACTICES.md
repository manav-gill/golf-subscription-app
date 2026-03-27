# SUPABASE + NODE.JS BACKEND BEST PRACTICES

## 1. PROPER RLS POLICY STRUCTURE FOR BACKEND SERVICES

### ❌ WRONG (What You Had):
```sql
CREATE POLICY "Users can view their own scores" ON public.scores
  FOR SELECT
  USING (auth.uid() = user_id OR false);
  -- This fails because auth.uid() returns NULL when using service key
```

### ✅ RIGHT (What You Need):
```sql
-- For users (frontend auth):
CREATE POLICY "Users read own data" ON public.scores
  FOR SELECT
  USING (auth.uid() = user_id);

-- For backend service role:
CREATE POLICY "Service role full access" ON public.scores
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

**Key Insight:**
- `auth.uid()` = current authenticated user (from Supabase Auth)
- `auth.role()` = role of current connection ('authenticated', 'anon', 'service_role')
- **Backend uses SERVICE_KEY** → `auth.role()` = 'service_role'
- **Frontend uses user JWT** → `auth.role()` = 'authenticated'

---

## 2. SUPABASE CLIENT INITIALIZATION PATTERNS

### ✅ CORRECT Backend Setup (Service Role):
```javascript
// server/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;  // ← Service key for backend

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Service key allows bypassing RLS for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
```

### ❌ WRONG (Anon Key in Backend):
```javascript
// DON'T DO THIS
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;  // ← Wrong for backend
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// This makes your backend subject to same RLS as frontend (limited access)
```

---

## 3. ERROR HANDLING & LOGGING PATTERNS

### ✅ GOOD Error Handling:
```javascript
async function getScores(userId) {
  console.log('[getScores] Fetching', { userId });

  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    // Log FULL error details for debugging
    console.error('[getScores] ERROR:', {
      message: error.message,
      code: error.code,           // e.g., 'PGRST301' (RLS violation)
      details: error.details,
      hint: error.hint,
      status: error.status
    });
    
    // Create meaningful error response
    if (error.code === 'PGRST301') {
      throw new Error('RLS Policy Blocking Access - Check policies');
    }
    throw new Error(`Database error: ${error.message}`);
  }

  console.log('[getScores] Success', { count: data?.length });
  return data || [];
}
```

### ❌ BAD Error Handling:
```javascript
// DON'T DO THIS
if (error) {
  throw new Error('Failed'); // Unhelpful for debugging
}
```

---

## 4. ENVIRONMENT VARIABLES CHECKLIST

### Required in `.env`:
```bash
# Express
PORT=5000

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs... # ← Service key, not anon key

# JWT (for your auth system, separate from Supabase auth)
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Optional
ADMIN_PASSWORD=DefaultAdminPass123
```

### Where to Get Keys:
1. Go to **Supabase Dashboard** → **Project Settings** → **API**
2. **Service Role Secret** = Use this in backend `.env`
3. **Anon Public** = Use this in frontend (if using Supabase Auth)

---

## 5. QUERY PATTERNS FOR COMMON SCENARIOS

### Pattern 1: User Accessing Own Data
```javascript
// User's JWT decoded with userId inside
async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', userId)
    .maybeSingle();
    
  if (error) throw error;
  return data;
}
```

### Pattern 2: Admin Accessing All Data (Backend)
```javascript
// Backend service account (always use service key for this)
async function getAllScores() {
  const { data, error } = await supabase
    .from('scores')
    .select('*');  // Service role can read all
    
  if (error) throw error;
  return data;
}
```

### Pattern 3: Insert with Foreign Key Reference
```javascript
async function addScore(userId, scoreValue, date) {
  // Make sure user_id exists in users table
  const { error } = await supabase
    .from('scores')
    .insert({
      user_id: userId,      // ← Must exist in users table
      score: scoreValue,
      date: date
    });
    
  if (error) {
    if (error.code === '23503') {  // ← Foreign key violation
      throw new Error('User does not exist');
    }
    throw error;
  }
}
```

### Pattern 4: Atomic Operations (Multiple Queries)
```javascript
async function updateWinnerStatus(winnerId, newStatus, adminId) {
  // Always verify admin first
  const { data: admin, error: adminError } = await supabase
    .from('users')
    .select('role')
    .eq('id', adminId)
    .maybeSingle();
    
  if (adminError || admin?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  // Then update winner
  const { data, error } = await supabase
    .from('winners')
    .update({ status: newStatus })
    .eq('id', winnerId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

---

## 6. TRANSACTION PATTERNS (When Available)

Note: Supabase JS client doesn't have built-in transaction support yet. For now:

```javascript
// Workaround: Use service role to atomically insert multiple rows
async function createDrawAndProcessWinners(drawNumbers, winnersData) {
  try {
    // 1. Insert draw
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .insert({ numbers: drawNumbers, month: 3, year: 2026 })
      .select()
      .single();
      
    if (drawError) throw drawError;

    // 2. Insert all winners
    const winnersWithDrawId = winnersData.map(w => ({
      ...w,
      draw_id: draw.id
    }));
    
    const { error: winnersError } = await supabase
      .from('winners')
      .insert(winnersWithDrawId);
      
    if (winnersError) throw winnersError;

    return draw;
  } catch (error) {
    console.error('[Transaction failed]', error);
    // Ideally, delete the draw if winners insert fails
    // This is a limitation - consider PostgreSQL functions for true transactions
    throw error;
  }
}
```

---

## 7. PAGINATION BEST PRACTICES

### Bad (Gets all rows into memory):
```javascript
const { data } = await supabase
  .from('scores')
  .select('*');  // ← What if 1 million rows?
```

### Good (Page by page):
```javascript
async function getScoresPaginated(userId, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  
  const { data, count, error } = await supabase
    .from('scores')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .range(offset, offset + pageSize - 1);
    
  if (error) throw error;
  
  return {
    data,
    total: count,
    hasMore: offset + pageSize < count
  };
}

// Usage:
const page1 = await getScoresPaginated(userId, 1, 10);
const page2 = await getScoresPaginated(userId, 2, 10);
```

---

## 8. INDEXING FOR PERFORMANCE

### Good Indexes for Your Schema:
```sql
-- Scores queries by user, sorted by date
CREATE INDEX idx_scores_user_date ON scores(user_id, date DESC, created_at DESC);

-- Draws queries by month/year
CREATE INDEX idx_draws_year_month ON draws(year DESC, month DESC);

-- Winners queries by draw or user
CREATE INDEX idx_winners_draw_id ON winners(draw_id);
CREATE INDEX idx_winners_user_id ON winners(user_id);

-- Winners status filtering
CREATE INDEX idx_winners_status ON winners(status);
```

---

## 9. VALIDATION PATTERNS

### Client-Side in Express:
```javascript
const { body, validationResult } = require('express-validator');

router.post('/scores', [
  body('score')
    .isInt({ min: 1, max: 45 })
    .withMessage('Score must be between 1 and 45'),
  body('date')
    .isISO8601()
    .withMessage('Date must be valid ISO8601')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Process request
  next();
});
```

### Server-Side in Supabase:
```sql
-- Add constraints at database level
CREATE TABLE scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  score integer NOT NULL CHECK (score >= 1 AND score <= 45),  -- ← Constraint
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## 10. SECRET MANAGEMENT

### ✅ DO:
```bash
# .env (local, NEVER commit)
SUPABASE_SERVICE_KEY=super-secret-key

# In production (Render, Vercel, etc):
# Set via platform's environment variable settings, NOT in code
```

### ❌ DON'T:
```javascript
// NEVER hardcode secrets
const serviceKey = 'my-secret-key';

// NEVER log secrets
console.log('Service Key:', process.env.SUPABASE_SERVICE_KEY);  // ← Bad

// NEVER expose in client code
const supabase = createClient(url, process.env.SUPABASE_SERVICE_KEY);  // ← Backend only
```

---

## 11. ROLE-BASED ACCESS CONTROL (RBAC) PATTERN

### Database Level:
```sql
-- RLS policies by role
CREATE POLICY "admin_full_access" ON winners
  FOR ALL
  USING (
    auth.role() = 'service_role'  -- Backend as admin
    OR 
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'  -- Authenticated admin users
  );
```

### Application Level:
```javascript
// Middleware
async function requireAdmin(req, res, next) {
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', req.user.id)
    .maybeSingle();
    
  if (error || user?.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  
  next();
}

// Usage
router.post('/draw/run', requireAdmin, drawController.runDraw);
```

---

## 12. TESTING PATTERNS

### Unit Test Example:
```javascript
jest.mock('../config/supabase');

describe('scoreService', () => {
  it('should fetch scores without errors', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnValue({
        data: [{ id: '1', score: 25 }],
        error: null
      })
    });

    const scores = await scoreService.getUserScores('user-123');
    expect(scores).toHaveLength(1);
    expect(scores[0].score).toBe(25);
  });
});
```

---

## 13. MONITORING & OBSERVABILITY

### Log Important Events:
```javascript
console.log('[scoreService.addScore]', {
  timestamp: new Date().toISOString(),
  userId,
  action: 'INSERT',
  table: 'scores',
  rowsAffected: 1
});

console.error('[scoreService.addScore] FAILED', {
  timestamp: new Date().toISOString(),
  userId,
  action: 'INSERT',
  error: error.message,
  errorCode: error.code,
  stackTrace: error.stack
});
```

### Structured Logging (Production):
```javascript
// Use Winston, Pino, or similar
logger.info('Score added', {
  userId,
  score: 25,
  timestamp: new Date()
});
```

---

## 14. BACKUP & DISASTER RECOVERY

### Backup Strategy:
- Use Supabase's built-in **automated backups** (daily)
- Enable **Point-in-Time Recovery (PITR)** in Supabase settings
- Periodically export data to CSV/JSON

### Recovery SQL Example:
```sql
-- Restore a deleted table (if backed up)
-- Use Supabase dashboard → Backups → Restore Point-in-Time
```

---

## SUMMARY CHECKLIST

✅ Use **SERVICE_KEY** in backend, **ANON_KEY** in frontend  
✅ Create **separate RLS policies** for users and service role  
✅ **Always log full error details** with code, hints, details  
✅ **Validate input** both client-side and database-side  
✅ **Never hardcode secrets**  
✅ **Use indexes** for frequently queried columns  
✅ **Paginate large queries**  
✅ **Check return codes** (23503 = FK violation, PGRST301 = RLS block)  
✅ **Test RLS policies** with direct SQL before trusting API  
✅ **Monitor and alert** on errors  

