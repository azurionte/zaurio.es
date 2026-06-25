create table if not exists public.dbt_celergo_employees (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  employee_id text not null,
  monthly_salary numeric(12,2) not null check (monthly_salary > 0),
  source text not null default 'dbt-monthly-changes',
  created_by_device text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dbt_celergo_employees_country_employee_unique unique (country_code, employee_id)
);

create index if not exists dbt_celergo_employees_country_idx
  on public.dbt_celergo_employees (country_code)
  where active;

alter table public.dbt_celergo_employees enable row level security;

create or replace function public.set_dbt_celergo_employees_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dbt_celergo_employees_updated_at on public.dbt_celergo_employees;
create trigger dbt_celergo_employees_updated_at
before update on public.dbt_celergo_employees
for each row
execute function public.set_dbt_celergo_employees_updated_at();
