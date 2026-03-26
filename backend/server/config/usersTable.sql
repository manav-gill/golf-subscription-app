-- Users table required for auth, profile, and subscription flows.
create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  password text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  -- Compatibility columns used by existing services.
  is_subscribed boolean not null default false,
  subscription_start timestamptz,
  subscription_end timestamptz,
  charity_id uuid,
  contribution_percentage numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_contribution_percentage_check
    check (contribution_percentage is null or contribution_percentage >= 10)
);

create index if not exists idx_users_email on public.users (email);
