-- Tinc Agenda — Supabase schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
--
-- Mirrors the localStorage shape: one row per day (date = 'YYYY-MM-DD') plus
-- one row per user holding cross-day data (date = '_global' — training plan,
-- work reminders, event priorities).

create table if not exists public.user_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.user_data enable row level security;

create policy "Users can view their own data"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own data"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own data"
  on public.user_data for delete
  using (auth.uid() = user_id);

-- Optional: enable magic-link auth in Authentication → Providers → Email
-- (enabled by default). Add your production domain under
-- Authentication → URL Configuration → Redirect URLs.
