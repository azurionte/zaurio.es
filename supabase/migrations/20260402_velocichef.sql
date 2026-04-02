create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.velocichef_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  allergies text[] not null default '{}',
  allergy_notes text not null default '',
  likes text[] not null default '{}',
  dislikes text[] not null default '{}',
  dietary_notes text not null default '',
  cooking_style text not null default 'balanced',
  goal_tags text[] not null default '{}',
  household_count integer not null default 1,
  household_members jsonb not null default '[]'::jsonb,
  planned_meals text[] not null default '{"breakfast","lunch","dinner"}',
  lunch_prep_night_before boolean not null default false,
  lunch_time text,
  dinner_time text,
  reminder_lead_minutes integer not null default 75,
  timezone text not null default 'Europe/Madrid',
  onboarding_completed boolean not null default false,
  notification_enabled boolean not null default false,
  freeze_notifications_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.velocichef_weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null default 'draft',
  shopping_completed boolean not null default false,
  freeze_prompt_answered boolean not null default false,
  week_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists velocichef_weeks_user_start_idx
  on public.velocichef_weeks (user_id, start_date desc);

create table if not exists public.velocichef_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_id uuid references public.velocichef_weeks(id) on delete cascade,
  meal_id text not null,
  feedback_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists velocichef_feedback_user_idx
  on public.velocichef_feedback (user_id, created_at desc);

create table if not exists public.velocichef_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists velocichef_push_subscriptions_user_idx
  on public.velocichef_push_subscriptions (user_id, enabled);

create table if not exists public.velocichef_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_id uuid references public.velocichef_weeks(id) on delete cascade,
  reminder_kind text not null,
  trigger_at timestamptz not null,
  delivered_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists velocichef_reminders_user_trigger_idx
  on public.velocichef_reminders (user_id, trigger_at);

alter table public.velocichef_profiles enable row level security;
alter table public.velocichef_weeks enable row level security;
alter table public.velocichef_feedback enable row level security;
alter table public.velocichef_push_subscriptions enable row level security;
alter table public.velocichef_reminders enable row level security;

drop policy if exists "VelociChef profiles read own" on public.velocichef_profiles;
create policy "VelociChef profiles read own"
  on public.velocichef_profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "VelociChef profiles write own" on public.velocichef_profiles;
create policy "VelociChef profiles write own"
  on public.velocichef_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "VelociChef weeks read own" on public.velocichef_weeks;
create policy "VelociChef weeks read own"
  on public.velocichef_weeks
  for select
  using (auth.uid() = user_id);

drop policy if exists "VelociChef weeks write own" on public.velocichef_weeks;
create policy "VelociChef weeks write own"
  on public.velocichef_weeks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "VelociChef feedback read own" on public.velocichef_feedback;
create policy "VelociChef feedback read own"
  on public.velocichef_feedback
  for select
  using (auth.uid() = user_id);

drop policy if exists "VelociChef feedback write own" on public.velocichef_feedback;
create policy "VelociChef feedback write own"
  on public.velocichef_feedback
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "VelociChef push subscriptions read own" on public.velocichef_push_subscriptions;
create policy "VelociChef push subscriptions read own"
  on public.velocichef_push_subscriptions
  for select
  using (auth.uid() = user_id);

drop policy if exists "VelociChef push subscriptions write own" on public.velocichef_push_subscriptions;
create policy "VelociChef push subscriptions write own"
  on public.velocichef_push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "VelociChef reminders read own" on public.velocichef_reminders;
create policy "VelociChef reminders read own"
  on public.velocichef_reminders
  for select
  using (auth.uid() = user_id);

drop policy if exists "VelociChef reminders write own" on public.velocichef_reminders;
create policy "VelociChef reminders write own"
  on public.velocichef_reminders
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_velocichef_profiles_updated_at on public.velocichef_profiles;
create trigger set_velocichef_profiles_updated_at
before update on public.velocichef_profiles
for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_velocichef_weeks_updated_at on public.velocichef_weeks;
create trigger set_velocichef_weeks_updated_at
before update on public.velocichef_weeks
for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_velocichef_push_subscriptions_updated_at on public.velocichef_push_subscriptions;
create trigger set_velocichef_push_subscriptions_updated_at
before update on public.velocichef_push_subscriptions
for each row execute procedure public.set_current_timestamp_updated_at();
