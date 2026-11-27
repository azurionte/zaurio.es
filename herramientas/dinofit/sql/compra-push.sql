-- Private Web Push state for DinoFit; never readable or writable through a user token.
begin;
create table if not exists public.dinofit_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.dinofit_documents(user_id) on delete cascade,
  endpoint text not null unique check(length(endpoint) between 1 and 2048),
  p256dh text not null check(length(p256dh)=87),
  auth text not null check(length(auth)=22),
  created_at timestamptz not null default now()
);
create index if not exists dinofit_push_subscriptions_user_idx
  on public.dinofit_push_subscriptions(user_id);
create table if not exists public.dinofit_push_deliveries (
  subscription_id uuid not null references public.dinofit_push_subscriptions(id) on delete cascade,
  occurrence text not null check(length(occurrence) between 1 and 40),
  claimed_at timestamptz not null default now(),
  primary key (subscription_id, occurrence)
);
create index if not exists dinofit_push_deliveries_claimed_idx on public.dinofit_push_deliveries(claimed_at);
alter table public.dinofit_push_subscriptions enable row level security;
alter table public.dinofit_push_deliveries enable row level security;
revoke all on table public.dinofit_push_subscriptions,public.dinofit_push_deliveries from public,anon,authenticated;
grant select,insert,update,delete on table public.dinofit_push_subscriptions,public.dinofit_push_deliveries to service_role;
notify pgrst, 'reload schema';
commit;
