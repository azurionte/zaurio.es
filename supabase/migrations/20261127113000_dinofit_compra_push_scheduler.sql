-- Apply only after the DinoFit push Edge Function is active.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create table if not exists public.dinofit_push_credentials (
  singleton boolean primary key default true check(singleton),
  cron_key text not null default encode(extensions.gen_random_bytes(32),'hex') check(length(cron_key)=64),
  vapid_public text check(length(vapid_public)=87),
  vapid_private text check(length(vapid_private)=43),
  check((vapid_public is null)=(vapid_private is null))
);
alter table public.dinofit_push_credentials enable row level security;
revoke all on table public.dinofit_push_credentials from public,anon,authenticated;
grant select,update on table public.dinofit_push_credentials to service_role;
insert into public.dinofit_push_credentials(singleton) values(true) on conflict do nothing;
select cron.schedule('dinofit-compra-push','*/2 * * * *',$job$
  select net.http_post(
    url:='https://adpjitccwwvlydrtvvqk.supabase.co/functions/v1/dinofit-push/cron',
    headers:=jsonb_build_object('Content-Type','application/json','X-DinoFit-Cron',cron_key),
    body:='{}'::jsonb,timeout_milliseconds:=10000)
  from public.dinofit_push_credentials where singleton
    and (vapid_public is null or exists(select 1 from public.dinofit_push_subscriptions))
$job$);
notify pgrst,'reload schema';
