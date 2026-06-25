create table if not exists public.dbt_celergo_employee_deletions (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  employee_id text not null,
  deleted_by_device text,
  source text not null default 'dbt-monthly-changes',
  deleted_at timestamptz not null default now(),
  constraint dbt_celergo_employee_deletions_country_employee_unique unique (country_code, employee_id)
);

create index if not exists dbt_celergo_employee_deletions_country_idx
  on public.dbt_celergo_employee_deletions (country_code);

alter table public.dbt_celergo_employee_deletions enable row level security;
