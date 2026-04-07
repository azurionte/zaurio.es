-- Add breakfast_time and snack_time columns to velocichef_profiles table
alter table public.velocichef_profiles
add column if not exists breakfast_time text,
add column if not exists snack_time text;