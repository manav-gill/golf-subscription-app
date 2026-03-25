-- Charity system tables and users table extensions
-- Run in Supabase SQL editor.

create table if not exists public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text null,
  image_url text null,
  created_at timestamptz not null default now()
);

alter table public.users
  add column if not exists charity_id uuid null references public.charities(id) on delete set null,
  add column if not exists contribution_percentage integer null;

alter table public.users
  drop constraint if exists users_contribution_percentage_min_chk;

alter table public.users
  add constraint users_contribution_percentage_min_chk
  check (contribution_percentage is null or contribution_percentage >= 10);

create index if not exists idx_users_charity_id on public.users (charity_id);
