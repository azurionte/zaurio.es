-- DineroZaurio v3 PREPROD cutover cleanup.
-- PROD is not affected. The legacy production schema remains the recovery/migration source
-- until DineroZaurio v3 is explicitly approved for production promotion.

drop table if exists public.dinerozaurio_temporary_drafts cascade;
drop table if exists public.month_adjustments cascade;
drop table if exists public.savings_goals cascade;
drop table if exists public.debt_items cascade;
drop table if exists public.expense_items cascade;
drop table if exists public.income_items cascade;
drop table if exists public.plans cascade;
drop table if exists public.dinerozaurio_preprod_seed_chunks cascade;
drop table if exists public.dinerozaurio_preprod_seed cascade;
