create schema if not exists dinofit_health_private;
revoke all on schema dinofit_health_private from public, anon, authenticated;
create table dinofit_health_private.upload_keys (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 key_hash bytea not null unique,
 created_at timestamptz not null default now()
);
alter table dinofit_health_private.upload_keys enable row level security;
revoke all on dinofit_health_private.upload_keys from public, anon, authenticated;
create table public.dinofit_apple_workouts (
 owner_id uuid not null references auth.users(id) on delete cascade,
 external_id uuid not null,
 started_at timestamptz not null,
 local_day date not null,
 label text not null check (char_length(label) between 1 and 100),
 minutes double precision not null check (minutes > 0 and minutes <= 1440),
 active_kcal double precision check (active_kcal >= 0 and active_kcal <= 20000),
 primary key (owner_id, external_id)
);
alter table public.dinofit_apple_workouts enable row level security;
revoke all on public.dinofit_apple_workouts from public, anon, authenticated;
grant select on public.dinofit_apple_workouts to authenticated;
create index dinofit_apple_workouts_owner_day_idx on public.dinofit_apple_workouts (owner_id,local_day);
create policy dinofit_apple_workouts_read_own on public.dinofit_apple_workouts for select to authenticated using ((select auth.uid()) = owner_id);
create function public.dinofit_apple_pair() returns text language plpgsql security definer set search_path='' as $$
declare v_owner uuid := auth.uid(); v_key text := pg_catalog.encode(extensions.gen_random_bytes(32),'hex');
begin
 if v_owner is null then raise sqlstate 'PT401'; end if;
 insert into dinofit_health_private.upload_keys(owner_id,key_hash) values(v_owner,extensions.digest(v_key,'sha256'))
 on conflict(owner_id) do update set key_hash=excluded.key_hash,created_at=now();
 return v_key;
end $$;
revoke execute on function public.dinofit_apple_pair() from public, anon, authenticated;
grant execute on function public.dinofit_apple_pair() to authenticated;
create function public.dinofit_apple_disconnect() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise sqlstate 'PT401'; end if;
 delete from dinofit_health_private.upload_keys where owner_id=auth.uid();
end $$;
revoke execute on function public.dinofit_apple_disconnect() from public, anon, authenticated;
grant execute on function public.dinofit_apple_disconnect() to authenticated;
create function public.dinofit_apple_ingest(items jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_key text; v_owner uuid; w jsonb; v_started timestamptz; v_label text; n int := 0;
begin
 v_key := pg_catalog.current_setting('request.headers',true)::jsonb->>'x-dinofit-upload-key';
 if v_key is null or v_key !~ '^[0-9a-f]{64}$' then raise sqlstate 'PT401'; end if;
 select owner_id into v_owner from dinofit_health_private.upload_keys where key_hash=extensions.digest(v_key,'sha256') for share;
 if v_owner is null then raise sqlstate 'PT401'; end if;
 if items is null or jsonb_typeof(items) <> 'array' then raise sqlstate 'PT400'; end if;
 if jsonb_array_length(items)>200 or pg_column_size(items)>128000 then raise sqlstate 'PT413'; end if;
 for w in select value from jsonb_array_elements(items) loop
  v_started := (w->>'start')::timestamptz; v_label:=btrim(w->>'type');
  if v_started < now()-interval '32 days' or v_started > now()+interval '1 day' then raise sqlstate 'PT422'; end if;
  insert into public.dinofit_apple_workouts as prior(owner_id,external_id,started_at,local_day,label,minutes,active_kcal)
  values(v_owner,(w->>'externalId')::uuid,v_started,(v_started at time zone 'Europe/Madrid')::date,v_label,(w->>'minutes')::double precision,(w->>'activeKcal')::double precision)
  on conflict(owner_id,external_id) do update set started_at=excluded.started_at,local_day=excluded.local_day,label=excluded.label,minutes=excluded.minutes,active_kcal=coalesce(excluded.active_kcal,prior.active_kcal);
  n:=n+1;
 end loop;
 return jsonb_build_object('ok',true,'received',n);
end $$;
revoke execute on function public.dinofit_apple_ingest(jsonb) from public, anon, authenticated;
grant execute on function public.dinofit_apple_ingest(jsonb) to anon;
notify pgrst, 'reload schema';
