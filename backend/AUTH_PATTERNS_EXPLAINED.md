# AUTHENTICATION PATTERNS - PROPER BCRYPT + JWT FLOW

## 📚 YOUR CURRENT IMPLEMENTATION (CORRECT!)

Your code is already following best practices! Let me show you how and why.

---

## 1. PASSWORD HASHING ON SIGNUP ✅

### Your Code:
```javascript
// authService.js - registerUser()
const hashedPassword = await bcrypt.hash(rawPassword, 10);

const { data: insertedUser, error: insertError } = await supabase
  .from('users')
  .insert([
    {
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,  // ← Store hash, NOT plain password!
      role: 'user'
    }
  ])
```

### Why This Is Correct:
```
1. User enters password: "TestPassword123"
2. bcrypt.hash(password, 10) generates: "$2a$10$abc123xyz..."
3. Store HASH in database, not plain password
4. Next time they login, compare input with stored hash

NEVER do this: ❌
  const hashedPassword = password;  // Wrong! Storing plaintext
  
ALWAYS do this: ✅
  const hashedPassword = await bcrypt.hash(password, 10);  // 10 = salt rounds
```

### The "10" Parameter Explained:
```javascript
bcrypt.hash(password, 10)
           └─────────┬──────┘
                     └─ Salt rounds (computational cost)
```

- **10 rounds** = Recommended default (takes ~100ms to hash)
- **More rounds** = Slower, more secure, but takes longer
- **Fewer rounds** = Faster, but less secure
- Production: Usually 10-12 rounds

---

## 2. PASSWORD VERIFICATION ON LOGIN ✅

### Your Code:
```javascript
// authService.js - loginUser()
const isPasswordValid = await bcrypt.compare(rawPassword, user.password);

if (!isPasswordValid) {
  throw new AuthServiceError('Invalid email or password', 401);
}
```

### Why This Works:

```
User logins with: "TestPassword123"
Stored hash in DB: "$2a$10$abc123xyz..."

bcrypt.compare("TestPassword123", "$2a$10$abc123xyz...")
  1. Takes input password
  2. Regenerates hash using same salt
  3. Compares against stored hash
  4. Returns true/false ✅

Why not just compare strings? ❌
  if (password === storedPassword) // WRONG! Hash is different each time
  
You can't reverse the hash, so you must:
  - Hash the input the same way
  - Compare the hashes
```

### Bcrypt Hashes Are Unique Each Time:
```javascript
const password = "TestPassword123";

const hash1 = bcrypt.hashSync(password, 10);
// $2a$10$abcdef123456789...

const hash2 = bcrypt.hashSync(password, 10);
// $2a$10$xyz789abcdef456...

// Both hashes are DIFFERENT but both match the password!
bcrypt.compareSync(password, hash1); // true ✅
bcrypt.compareSync(password, hash2); // true ✅

// You can't do: hash1 === hash2 (false!) ❌
```

---

## 3. JWT TOKEN GENERATION ✅

### Your Code:
```javascript
// authService.js - generateToken()
function generateToken(userId, role) {
  const secret = requireJwtSecret();
  return jwt.sign({ id: userId, role }, secret, { expiresIn: JWT_EXPIRES_IN });
}
```

### JWT Flow:

```
1. After password verified, generate token
   
   jwt.sign(
     payload: { id: user.id, role: user.role },  // What to encode
     secret: JWT_SECRET,                          // Sign it with secret
     expiresIn: '7d'                              // Expires in 7 days
   )
   
   Result: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFiYy0xMjMiLCJyb2xlIjoiLCJpYXQiOjE2NzI1MTksImV4cCI6MTY3MzEyNH0.abc123..."

2. Send token to frontend
   
3. Frontend stores in localStorage
   localStorage.setItem('authToken', token)
   
4. Frontend sends on every protected request
   headers: { Authorization: 'Bearer ' + token }
   
5. Backend verifies token with authMiddleware
   jwt.verify(token, JWT_SECRET)
   └─ Only works if JWT_SECRET matches! ✅
```

### JWT Structure (3 parts separated by `.`):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  .  eyJpZCI6ImFiYy0xMjMifQ  .  abc123xyz
Header (algorithm)                        Payload (your data)         Signature (proof)
```

### Why Token Expires:

```javascript
expiresIn: '7d'  // Token is valid for 7 days

After 7 days:
- Token is still valid in format
- But jwt.verify() throws "TokenExpiredError"
- User must login again to get new token
- This is intentional! Limits damage if token stolen.
```

---

## 4. JWT VERIFICATION ON PROTECTED ROUTES ✅

### Your Auth Middleware:
```javascript
// authMiddleware.js (pseudocode)
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];  // Get 'Bearer TOKEN'
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Attach user to request
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}
```

### Flow:

```
Frontend includes: Authorization: Bearer eyJhbGc...
                                        └─ JWT token

Backend authMiddleware:
  1. Extract token from header
  2. jwt.verify(token, secret)
     └─ If token was tampered with or secret is wrong → FAILS ❌
     └─ If token expired → FAILS ❌
     └─ If signature doesn't match → FAILS ❌
  3. If verification succeeds → attach user data to req.user
  4. Call next() to continue to protected route

Protected route can now use:
  req.user.id      // '123-abc'
  req.user.role    // 'user'
```

---

## 5. COMPLETE AUTHENTICATION FLOW DIAGRAM

```
SIGNUP FLOW:
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 1. User enters: email, password, name
       ├─→ POST /api/auth/signup
       │
┌──────▼──────┐
│  Backend    │
└──────┬──────┘
       │ 2. Validate input
       ├─→ Check email not taken
       │
       │ 3. Hash password
       ├─→ bcrypt.hash(password, 10)
       │   Result: "$2a$10$..."
       │
       │ 4. Store in database
       ├─→ INSERT INTO users (email, password_hash)
       │
       │ 5. Generate JWT
       ├─→ jwt.sign({ id, role }, secret)
       │   Result: "eyJhbGc..."
       │
       ├─→ 201 Created
       │   { token: "eyJhbGc...", user: {...} }
       │
┌──────▼──────┐
│  Frontend   │
└─────────────┘
       │
       ├─→ localStorage.setItem('authToken', token)
       ├─→ Redirect to dashboard


LOGIN FLOW:
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 1. User enters: email, password
       ├─→ POST /api/auth/login
       │
┌──────▼──────┐
│  Backend    │
└──────┬──────┘
       │ 2. Query database
       ├─→ SELECT * FROM users WHERE email = ?
       │   Result: { id: '123', password: '$2a$10$...' }
       │
       │ 3. Compare password
       ├─→ bcrypt.compare(input_password, stored_hash)
       │   ├─ If false → 401 "Invalid email or password"
       │   ├─ If true → Continue
       │
       │ 4. Generate JWT
       ├─→ jwt.sign({ id: '123', role: 'user' }, secret)
       │
       ├─→ 200 OK
       │   { token: "eyJhbGc...", user: {...} }
       │
┌──────▼──────┐
│  Frontend   │
└─────────────┘
       │
       ├─→ localStorage.setItem('authToken', token)
       ├─→ Redirect to dashboard


PROTECTED REQUEST FLOW:
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 1. Make API call with token
       ├─→ GET /api/users/me
       │   Authorization: Bearer eyJhbGc...
       │
┌──────▼──────┐
│  authMiddleware
└──────┬──────┘
       │ 2. Extract token
       ├─→ token = "eyJhbGc..."
       │
       │ 3. Verify token
       ├─→ jwt.verify(token, JWT_SECRET)
       │   ├─ All checks pass → decoded = { id: '123', role: 'user' }
       │   └─ Attach to request: req.user = decoded
       │
       │ 4. Call protected route handler
       ├─→ next()
       │
┌──────▼──────┐
│  Route Handler
└──────┬──────┘
       │ 5. Handler can use req.user.id
       ├─→ SELECT * FROM users WHERE id = req.user.id
       │
       ├─→ 200 OK { id, email, role, ... }
       │
┌──────▼──────┐
│  Frontend   │
└─────────────┘
       └─→ Display user profile ✅
```

---

## 6. SECURITY COMPARISON

### ❌ WRONG - No Bcrypt:
```javascript
// DON'T DO THIS!
registerUser(email, password) {
  // Store plaintext password (VERY BAD!)
  INSERT INTO users (email, password) VALUES (email, password);
}

loginUser(email, password) {
  // Compare plaintext (extremely insecure!)
  if (storedPassword === password) {
    // login
  }
}

// Risk: If database is hacked, attacker has all passwords!
// Breach affects other sites (users reuse passwords)
```

### ✅ RIGHT - With Bcrypt:
```javascript
// DO THIS!
registerUser(email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  INSERT INTO users (email, password) VALUES (email, hashedPassword);
}

loginUser(email, password) {
  const isValid = await bcrypt.compare(password, storedHash);
  if (isValid) {
    // login
  }
}

// Risk: Even if database is hacked, attacker can't reverse bcrypt hash
// Passwords are safe! ✅
```

---

## 7. REAL-WORLD BCRYPT EXAMPLE

### Signup with New User:

```bash
# Frontend sends:
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "MySecurePassword123!"
}

# Backend processing:
1. Normalize: email = "john@example.com" (lowercase)
2. Hash: bcrypt.hash("MySecurePassword123!", 10)
   └─ Result: "$2a$10$N9qo8uCoKe4...qsQj5iVHqTcBvV6d8RbZc" 
      (60 characters, includes salt + cost factor)

# Database stores:
{
  id: "abc-123",
  name: "John Doe",
  email: "john@example.com",
  password: "$2a$10$N9qo8uCoKe4...qsQj5iVHqTcBvV6d8RbZc",  ← Hash, not plaintext!
  role: "user"
}

# Backend responds:
201 Created
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "abc-123",
      "email": "john@example.com",
      "role": "user"
    }
  }
}

# Frontend stores token in localStorage
```

---

## 8. COMMON BCRYPT MISTAKES ⚠️

### Mistake 1: Comparing Hashes Directly
```javascript
// ❌ WRONG
if (storedHash === bcrypt.hashSync(inputPassword, 10)) {
  // This will NEVER work!
  // Different hashes each time!
}

// ✅ RIGHT
const isValid = await bcrypt.compare(inputPassword, storedHash);
if (isValid) {
  // Works!
}
```

### Mistake 2: Using Old/Weak Algorithms
```javascript
// ❌ WRONG - MD5, SHA1 (too fast, easy to crack)
import md5 from 'md5';
const hash = md5(password);  // Bad!

// ✅ RIGHT - Bcrypt (slow by design)
const hash = await bcrypt.hash(password, 10);  // Good!
```

### Mistake 3: Low Salt Rounds
```javascript
// ❌ WRONG - Too weak
bcrypt.hash(password, 2);  // Only 2^2 = 4 iterations

// ✅ RIGHT - Recommended
bcrypt.hash(password, 10);  // 2^10 = 1024 iterations, takes ~100ms
```

### Mistake 4: Storing JWT Secret in Code
```javascript
// ❌ WRONG - Visible in source code
const JWT_SECRET = "my-secret-key";

// ✅ RIGHT - Use environment variable
const JWT_SECRET = process.env.JWT_SECRET;
// Set in .env, never commit to git!
```

---

## 9. ENVIRONMENT VARIABLES FOR AUTH

### .env File (Backend):
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # Service key, NOT anon key!

# Server
PORT=5000
```

### Why This Matters:
```
JWT_SECRET:
  - Must be 32+ characters (longer = more secure)
  - NEVER expose in frontend code
  - NEVER commit to git
  - If leaked, all tokens can be forged!

SUPABASE_SERVICE_KEY:
  - Allows backend to bypass RLS
  - NEVER expose in frontend code
  - NEVER commit to git
  - If leaked, attacker can access/modify database!
```

---

## ✅ SUMMARY: YOUR CODE IS CORRECT!

| Aspect | Your Implementation | Status |
|--------|-------------------|--------|
| **Password Hashing** | bcrypt.hash(password, 10) | ✅ Correct |
| **Password Verification** | bcrypt.compare() | ✅ Correct |
| **JWT Generation** | jwt.sign() with secret | ✅ Correct |
| **JWT Verification** | jwt.verify() in middleware | ✅ Correct |
| **Token Expiration** | expiresIn: '7d' | ✅ Correct |
| **Email Normalization** | .toLowerCase() | ✅ Correct |
| **Database Storage** | Hash, not plaintext | ✅ Correct |
| **RLS Configuration** | Service role policies | ✅ Correct |

---

## 🎓 WHAT YOU'VE LEARNED

1. **Bcrypt** hashes passwords one-way (can't reverse)
2. **Salt rounds** (10) add computational cost (security vs speed tradeoff)
3. **JWT tokens** encode user data + expiration + signature
4. **Token verification** ensures token wasn't tampered with
5. **Never store plaintext passwords** - always hash!
6. **Never expose secrets** - use environment variables
7. **RLS policies** + **JWT verification** = defense in depth ✅

---

**Your authentication implementation is production-ready!**

Now you know how and why each piece works.

