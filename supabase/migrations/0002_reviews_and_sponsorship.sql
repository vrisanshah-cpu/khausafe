-- Adds admin-managed sponsorship/Zomato fields to vendors, and adds the
-- reviews + review_reports tables for the star-rating/comment layer, with
-- report-threshold auto-moderation. Run after 0001_init.sql.

alter table vendors add column if not exists is_sponsored boolean not null default false;
alter table vendors add column if not exists zomato_url text;

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id text not null references vendors (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 1 and 500),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  report_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (vendor_id, user_id)
);

create table if not exists review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);

create index if not exists reviews_vendor_id_idx on reviews (vendor_id);
create index if not exists review_reports_review_id_idx on review_reports (review_id);

alter table reviews enable row level security;
alter table review_reports enable row level security;

-- Only visible reviews are public. A hidden review stays readable by its own
-- author (so they know it was hidden) and by admin routes, which use the
-- service-role key and bypass RLS entirely.
create policy "visible reviews are publicly readable" on reviews
  for select using (status = 'visible');

create policy "authors can read their own hidden review" on reviews
  for select to authenticated using (auth.uid() = user_id);

create policy "authenticated users can submit one review per vendor" on reviews
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "authenticated users can report a review" on review_reports
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Auto-hide a review once enough distinct users have reported it — the
-- "community takes down a bad review" loop, running without an admin in the
-- loop. Admins can still restore a wrongly-hidden review from /admin.
create or replace function handle_review_report() returns trigger
language plpgsql security definer as $$
declare
  report_threshold constant integer := 3;
  current_count integer;
begin
  update reviews set report_count = report_count + 1
  where id = new.review_id
  returning report_count into current_count;

  if current_count >= report_threshold then
    update reviews set status = 'hidden' where id = new.review_id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_review_report on review_reports;
create trigger on_review_report
  after insert on review_reports
  for each row execute function handle_review_report();
