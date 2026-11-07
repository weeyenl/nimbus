-- Nimbus cloud storage. Run this once in Supabase -> SQL Editor -> New query -> Run.
-- Each collection is a table of { id, data jsonb }; the app reads/writes through supabase-js.

do $$
declare
  t text;
begin
  foreach t in array array[
    'customers',          -- owners, with their pets nested inside
    'appointments',
    'staff',
    'memberships',
    'grooming_records',
    'payments',
    'services',
    'addons'
  ]
  loop
    execute format(
      'create table if not exists public.%I (
         id text primary key,
         data jsonb not null,
         updated_at timestamptz not null default now()
       )', t);

    execute format('alter table public.%I enable row level security', t);

    -- Only signed-in staff can touch data. The anon key alone gets nothing.
    execute format('drop policy if exists "staff full access" on public.%I', t);
    execute format(
      'create policy "staff full access" on public.%I
         for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
