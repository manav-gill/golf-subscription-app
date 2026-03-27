const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword
    });

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('[SIGNUP ERROR]', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`\n[DEBUG] --- LOGIN ATTEMPT STARTED ---`);
    console.log(`[DEBUG] Route Hit! Extracted Email: "${email}", Password Length: ${password ? password.length : 0}`);

    // 1. Validate inputs exist
    if (!email || !password) {
      console.log(`[DEBUG] Failed: Missing email or password`);
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // 2. Normalize and Find user
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    
    console.log(`[DEBUG] Database query for email "${normalizedEmail}"`);
    console.log(`[DEBUG] User Found in DB:`, user ? 'YES' : 'NO');
    
    if (!user) {
      console.log(`[DEBUG] Failed: User not found in database`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`[DEBUG] DB Password Hash stored:`, user.password.substring(0, 15) + '...');

    // 3. Compare password
    console.log(`[DEBUG] Comparing raw password with DB hash...`);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`[DEBUG] Password Match Result:`, isMatch);

    if (!isMatch) {
      console.log(`[DEBUG] Failed: Passwords did not match`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. Generate token
    let token;
    try {
      token = generateToken(user._id);
      console.log(`[DEBUG] Token generated successfully:`, token.substring(0, 15) + '...');
    } catch (err) {
      console.error(`[DEBUG] Token Generation Failed!`, err.message);
      return res.status(500).json({ message: 'Server error generating token' });
    }

    // 5. Success response
    console.log(`[DEBUG] Login successful. Sending response to frontend.`);
    res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: token
    });

  } catch (error) {
    console.error('[CRITICAL LOGIN ERROR]', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = { signup, login };
