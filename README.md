# KhauSafe

Find hygiene-rated street food vendors nearby — built on India's FSSAI Clean Street Food
Hub certification data where it exists, plus a community-observed layer for everywhere else.

## Data reality (read this first)

There is no confirmed live FSSAI ratings API. Coverage of official certification is limited to
named "Clean Street Food Hub" clusters (e.g. Girgaon Chowpatty, Juhu Chowpatty). Vendor data in
this repo is **manually curated** from public reporting, not pulled from any FSSAI system — see
the `source` field on every entry in [`src/data/vendors.json`](src/data/vendors.json).

The data layer (`src/lib/vendors.ts`) is written so the local-JSON source can be swapped for a
real Supabase table (or a real FSSAI feed, if one is ever confirmed) without touching call sites.

## Status

- **Phase 1 — map + seeded vendors**: done. Runs entirely on local JSON, no backend required.
- **Phase 2 — community observations**: UI and schema built (`supabase/migrations/0001_init.sql`,
  `ObservationForm`, `/api/observations`). Needs a live Supabase project to actually submit/read —
  degrades to a "not connected yet" message until then.
- **Phase 3 — search/filter + accounts**: filter bar (area/category/certification) and vendor
  detail page work now on local data. Auth (`/login`, magic link) is built but needs Supabase.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The map and vendor list work immediately —
no environment variables required.

## Connecting Supabase (when ready)

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor.
3. Copy `.env.local.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Restart the dev server. Auth and observation submission activate automatically.

## Stack

Next.js (App Router) · Tailwind CSS · Leaflet + OpenStreetMap tiles (no API key needed) ·
Supabase (Postgres + Auth, optional until connected)
