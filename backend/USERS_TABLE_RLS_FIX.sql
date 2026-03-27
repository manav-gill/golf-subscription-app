-- ============================================================================
-- GOLF CHARITY PLATFORM - USERS TABLE RLS FIX
-- ============================================================================
-- CRITICAL: This fixes login by allowing backend service role to read users
-- Run this in Supabase SQL Editor if login is failing
-- ============================================================================

-- Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP OLD POLICIES (if they exist) to avoid conflicts
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role manages users" ON public.users;
DROP POLICY IF EXISTS "Users read own profile" ON public.users;
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
DROP POLICY IF EXISTS "Users full access" ON public.users;

-- ============================================================================
-- CREATE NEW RLS POLICIES
-- ============================================================================

-- POLICY 1: Backend service role can manage users (for signup, login, updates)
CREATE POLICY "Service role manages users" ON public.users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- POLICY 2: Authenticated users can read their own profile
CREATE POLICY "Users read own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- POLICY 3: Authenticated users can update their own profile
CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- VERIFICATION QUERIES (run these to confirm setup)
-- ============================================================================

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE tablename = 'users' AND schemaname = 'public';

-- Check policies exist
-- SELECT policyname, tablename, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'users' AND schemaname = 'public';

-- Check users in database
-- SELECT id, email, name, password FROM public.users;

-- Check password format (should start with $2a$ or $2b$)
-- SELECT email, password, LEFT(password, 10) as hash_prefix FROM public.users;

-- ============================================================================
-- TROUBLESHOOTING: If login still fails, run these diagnostic queries
-- ============================================================================

-- Check if users table has rows
-- SELECT COUNT(*) as total_users FROM public.users;

-- Check if specific user exists
-- SELECT * FROM public.users WHERE email = 'test@example.com';

-- Check if passwords are hashed (NOT plaintext)
-- SELECT email, password, 
--   CASE 
--     WHEN password LIKE '$2a$%' THEN 'Bcrypt Hash ✅'
--     WHEN password LIKE '$2b$%' THEN 'Bcrypt Hash ✅'
--     WHEN LENGTH(password) < 20 THEN 'Likely Plaintext ❌'
--     ELSE 'Unknown Format'
--   END as password_type
-- FROM public.users;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
