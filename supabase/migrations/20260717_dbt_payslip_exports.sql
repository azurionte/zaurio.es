create table if not exists public.dbt_payslip_exports (
  country_code text not null,
  period_key text not null,
  client_code text not null default '',
  employee_count integer not null default 0,
  downloaded_by_device text,
  downloaded_at timestamptz not null default now(),
  constraint dbt_payslip_exports_unique unique (country_code, period_key, client_code)
);

create index if not exists dbt_payslip_exports_period_idx
  on public.dbt_payslip_exports (period_key, country_code);

alter table public.dbt_payslip_exports enable row level security;
