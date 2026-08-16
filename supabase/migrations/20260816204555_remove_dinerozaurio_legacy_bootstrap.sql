-- DineroZaurio v3 PREPROD cleanup.
-- The legacy bootstrap function referenced the removed v2 financial tables.

drop function if exists public.bootstrap_dinerozaurio_preprod() cascade;
