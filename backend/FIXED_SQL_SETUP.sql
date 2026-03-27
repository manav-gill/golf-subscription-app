-- ============================================================================
-- GOLF CHARITY SUBSCRIPTION PLATFORM - FIXED DATABASE SETUP
-- ============================================================================
-- CRITICAL CHANGES:
-- 1. RLS policies now allow service role (backend) to access data
-- 2. All constraints and indexes included
-- 3. Run this entire script in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. SCORES TABLE (FIX: Allow service role + verify auth.uid for frontend)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 1 AND score <= 45),
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_scores_user_id_date ON public.scores(user_id, date DESC, created_at DESC);

-- Enable RLS
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- POLICY 1: Allow users to read their own scores (for frontend auth)
CREATE POLICY IF NOT EXISTS "Users read own scores" ON public.scores
  FOR SELECT
  USING (auth.uid() = user_id);

-- POLICY 2: Allow users to insert their own scores (for frontend auth)
CREATE POLICY IF NOT EXISTS "Users insert own scores" ON public.scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- POLICY 3: IMPORTANT - Allow service role (backend) to access everything
CREATE POLICY IF NOT EXISTS "Service role full access scores" ON public.scores
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 2. DRAWS TABLE (FIX: Allow service role)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.draws (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  numbers integer[] NOT NULL CHECK (array_length(numbers, 1) = 5),
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT draws_month_year_unique UNIQUE (month, year),
  CONSTRAINT draws_numbers_valid CHECK (
    (numbers[1] >= 1 AND numbers[1] <= 45) AND
    (numbers[2] >= 1 AND numbers[2] <= 45) AND
    (numbers[3] >= 1 AND numbers[3] <= 45) AND
    (numbers[4] >= 1 AND numbers[4] <= 45) AND
    (numbers[5] >= 1 AND numbers[5] <= 45)
  )
);

-- Index
CREATE INDEX IF NOT EXISTS idx_draws_year_month ON public.draws(year DESC, month DESC);

-- Enable RLS
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;

-- POLICY 1: Allow everyone to read draws (public read)
CREATE POLICY IF NOT EXISTS "Draws public read" ON public.draws
  FOR SELECT
  USING (true);

-- POLICY 2: IMPORTANT - Allow service role to create draws
CREATE POLICY IF NOT EXISTS "Service role manages draws" ON public.draws
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 3. WINNERS TABLE (FIX: Allow service role)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.winners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  draw_id uuid NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  match_count integer NOT NULL CHECK (match_count IN (3, 4, 5)),
  prize_amount numeric(12, 2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT winners_draw_user_unique UNIQUE (draw_id, user_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_winners_user_id ON public.winners(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_draw_id ON public.winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_status ON public.winners(status);

-- Enable RLS
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- POLICY 1: Allow users to read their own winnings
CREATE POLICY IF NOT EXISTS "Users read own winners" ON public.winners
  FOR SELECT
  USING (auth.uid() = user_id);

-- POLICY 2: IMPORTANT - Allow service role (backend) full access
CREATE POLICY IF NOT EXISTS "Service role full access winners" ON public.winners
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 4. CHARITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.charities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;

-- POLICY 1: Everyone can read charities
CREATE POLICY IF NOT EXISTS "Charities public read" ON public.charities
  FOR SELECT
  USING (true);

-- POLICY 2: Service role can manage charities
CREATE POLICY IF NOT EXISTS "Service role manages charities" ON public.charities
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 5. UPDATE USERS TABLE (if needed)
-- ============================================================================
DO $$
BEGIN
  -- Add charity fields if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'charity_id'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN charity_id uuid REFERENCES public.charities(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'contribution_percentage'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN contribution_percentage integer CHECK (contribution_percentage IS NULL OR contribution_percentage >= 10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_subscribed'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN is_subscribed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription_start'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN subscription_start timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription_end'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN subscription_end timestamptz;
  END IF;
END $$;

-- Add index
CREATE INDEX IF NOT EXISTS idx_users_charity_id ON public.users(charity_id);

-- ============================================================================
-- VERIFICATION QUERIES (Run these after setup to confirm)
-- ============================================================================

-- Check all tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check scores table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'scores';

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('scores', 'draws', 'winners', 'charities');

-- Check policies
-- SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('scores', 'draws', 'winners', 'charities');

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
