-- Golf Charity Subscription Platform - Complete Database Setup
-- Run this entire script in Supabase SQL Editor (SQL tab)
-- This creates all required tables and indexes for the platform

-- ============================================================================
-- CHARITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.charities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Charities are publicly readable" ON public.charities
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create charities" ON public.charities
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Only admins can update charities" ON public.charities
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Only admins can delete charities" ON public.charities
  FOR DELETE
  USING (false);

-- ============================================================================
-- SCORES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 1 AND score <= 45),
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_scores_user_date_created
  ON public.scores(user_id, date DESC, created_at DESC);

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scores" ON public.scores
  FOR SELECT
  USING (auth.uid() = user_id OR false);

CREATE POLICY "Users can insert their own scores" ON public.scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR false);

-- ============================================================================
-- DRAWS TABLE
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

CREATE INDEX IF NOT EXISTS idx_draws_year_month
  ON public.draws(year DESC, month DESC);

ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Draws are publicly readable" ON public.draws
  FOR SELECT
  USING (true);

-- ============================================================================
-- WINNERS TABLE
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

CREATE INDEX IF NOT EXISTS idx_winners_draw_id ON public.winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_user_id ON public.winners(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_status ON public.winners(status);

ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own winnings" ON public.winners
  FOR SELECT
  USING (auth.uid() = user_id OR false);

-- ============================================================================
-- UPDATE USERS TABLE (Add charity fields if missing)
-- ============================================================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS charity_id uuid REFERENCES public.charities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contribution_percentage integer CHECK (contribution_percentage IS NULL OR contribution_percentage >= 10);

CREATE INDEX IF NOT EXISTS idx_users_charity_id ON public.users(charity_id);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
-- All tables created successfully!
-- You can now use the platform with Scores, Charities, Draws, and Winners features.
