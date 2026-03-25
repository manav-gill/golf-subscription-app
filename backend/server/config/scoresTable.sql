-- Scores table for Golf Charity Subscription Platform
-- Run this in Supabase SQL editor.

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  score integer not null check (score between 1 and 45),
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_scores_user_date_created
  on public.scores (user_id, date desc, created_at desc);
