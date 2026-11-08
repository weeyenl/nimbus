-- ==============================================================================
-- NIMBUS COMPLETE DATABASE RESET & SETUP SCRIPT
-- Run this in Supabase -> SQL Editor -> New query -> Run
-- ==============================================================================

-- 1. DROP ALL OLD TABLES (Prisma tables, old relational tables, or previous schema)
drop table if exists public.credit_transactions cascade;
drop table if exists public.remaining_add_on_allowances cascade;
drop table if exists public.customer_memberships cascade;
drop table if exists public.add_on_allowance_templates cascade;
drop table if exists public.membership_tiers cascade;
drop table if exists public.payments cascade;
drop table if exists public.grooming_records cascade;
drop table if exists public.appointment_addons cascade;
drop table if exists public.appointments cascade;
drop table if exists public.service_addons cascade;
drop table if exists public.service_price_rules cascade;
drop table if exists public.services cascade;
drop table if exists public.permanent_notes cascade;
drop table if exists public.vaccinations cascade;
drop table if exists public.pets cascade;
drop table if exists public.customers cascade;
drop table if exists public.weekly_schedules cascade;
drop table if exists public.staff cascade;
drop table if exists public.addons cascade;
drop table if exists public.memberships cascade;
drop table if exists public.promo_codes cascade;
drop table if exists public.settings cascade;
drop table if exists public.backups cascade;
drop table if exists public._prisma_migrations cascade;

-- 2. CREATE ALL REQUIRED NIMBUS CLOUD TABLES WITH (id, data, updated_at)
create table public.customers (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.staff (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.membership_tiers (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.grooming_records (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.payments (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.services (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.addons (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.promo_codes (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.settings (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.backups (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- 3. DISABLE ROW LEVEL SECURITY FOR STAFF PIN TABLET / DIRECT ACCESS
do $$
declare
  t text;
begin
  foreach t in array array[
    'customers',
    'appointments',
    'staff',
    'memberships',
    'membership_tiers',
    'grooming_records',
    'payments',
    'services',
    'addons',
    'promo_codes',
    'settings',
    'backups'
  ]
  loop
    execute format('drop policy if exists "staff full access" on public.%I', t);
    execute format('alter table public.%I disable row level security', t);
  end loop;
end $$;
