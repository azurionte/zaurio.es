insert into storage.buckets (id, name, public, file_size_limit)
values ('payslip-updates', 'payslip-updates', false, 536870912)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated admins can read payslip updates'
  ) then
    create policy "Authenticated admins can read payslip updates"
    on storage.objects
    for select
    to authenticated
    using (bucket_id = 'payslip-updates');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated admins can upload payslip updates'
  ) then
    create policy "Authenticated admins can upload payslip updates"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'payslip-updates');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated admins can replace payslip updates'
  ) then
    create policy "Authenticated admins can replace payslip updates"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'payslip-updates')
    with check (bucket_id = 'payslip-updates');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated admins can delete payslip updates'
  ) then
    create policy "Authenticated admins can delete payslip updates"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'payslip-updates');
  end if;
end $$;
