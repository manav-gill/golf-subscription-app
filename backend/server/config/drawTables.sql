-- Draw and winners tables for Golf Charity Subscription Platform
-- Run this script in Supabase SQL editor.

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  numbers integer[] not null,
  month integer not null check (month between 1 and 12),
  year integer not null,
  created_at timestamptz not null default now(),
  constraint draws_numbers_len_chk check (array_length(numbers, 1) = 5),
  constraint draws_numbers_range_chk check (
    numbers[1] between 1 and 45 and
    numbers[2] between 1 and 45 and
    numbers[3] between 1 and 45 and
    numbers[4] between 1 and 45 and
    numbers[5] between 1 and 45
  ),
  constraint draws_month_year_unique unique (month, year)
);

create table if not exists public.winners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  draw_id uuid not null references public.draws(id) on delete cascade,
  match_count integer not null check (match_count in (3, 4, 5)),
  prize_amount numeric(12, 2) null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid')),
  created_at timestamptz not null default now(),
  constraint winners_draw_user_unique unique (draw_id, user_id)
);

create index if not exists idx_draws_year_month on public.draws (year desc, month desc);
create index if not exists idx_winners_draw_id on public.winners (draw_id);
create index if not exists idx_winners_user_id on public.winners (user_id);
create index if not exists idx_winners_status on public.winners (status);
