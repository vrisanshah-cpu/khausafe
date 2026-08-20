-- KhauSafe schema: vendors (official/curated data) + observations (community layer)
-- Run this in the Supabase SQL editor once a project is connected.

create table if not exists vendors (
  id text primary key,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  area text not null,
  category text not null check (category in ('chaat', 'juice', 'snacks', 'sweets', 'beverages', 'other')),
  certification_status text not null check (
    certification_status in ('clean_street_food_hub', 'fssai_hygiene_rated', 'uncertified', 'unknown')
  ),
  source text not null,
  created_at timestamptz not null default now()
);

create table if not exists observations (
  id uuid primary key default gen_random_uuid(),
  vendor_id text not null references vendors (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  checklist_responses jsonb not null,
  submitted_at timestamptz not null default now()
);

create index if not exists observations_vendor_id_idx on observations (vendor_id);

alter table vendors enable row level security;
alter table observations enable row level security;

-- Vendor data (official + curated) is public read-only; writes happen via the
-- Supabase dashboard/CLI until an admin workflow exists.
create policy "vendors are publicly readable" on vendors
  for select using (true);

-- Observations are publicly readable (that's the point — community trust
-- signal), but only signed-in users can submit, and only as themselves.
create policy "observations are publicly readable" on observations
  for select using (true);

create policy "authenticated users can submit observations" on observations
  for insert to authenticated
  with check (auth.uid() = user_id);
