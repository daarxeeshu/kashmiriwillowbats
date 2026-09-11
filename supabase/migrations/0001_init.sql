-- ── Kashmiri Willow Bats — initial schema ──────────────────────────────────────
--
-- Run this once against a new Supabase project: SQL Editor → paste → Run.
-- Safe to re-run; every statement is guarded.
--
-- ── The security model, stated up front ──
-- RLS is enabled on all three tables and *no policies are created*. In Postgres
-- that denies the `anon` and `authenticated` roles outright. Only the service role
-- (which bypasses RLS) can read or write, and that key lives in one server-side
-- module — see `lib/db/supabase.ts`.
--
-- This is deliberate rather than lazy. The browser never talks to Supabase in this
-- app: orders are priced and written by `/api/orders`, and the dashboard is behind
-- HTTP Basic in `middleware.ts`. Adding policies would mean re-authorising requests
-- that were already authorised, and a policy that is slightly too permissive on the
-- orders table exposes customer names, phone numbers and home addresses. Nothing is
-- the correct policy set here.
--
-- If the storefront ever needs to read its own data from the browser, add policies
-- then, for that table only, and never to `orders`.

-- ── Orders ─────────────────────────────────────────────────────────────────────
--
-- The full order is kept in `payload` as JSONB, with the handful of fields the app
-- actually filters and sorts on promoted to real columns.
--
-- That split is the point: an order is a *record of what was agreed*, so it must be
-- stored whole and never reassembled from normalised parts that a later schema
-- change could reinterpret. The line items are read as a block by the dashboard and
-- the WhatsApp message builder and are never queried across, so a lines table would
-- buy joins nobody performs. The promoted columns exist because `list()` sorts by
-- `created_at` and `setStatus` updates by `order_id`, and doing either inside JSONB
-- means no index.
create table if not exists public.orders (
  -- Human-readable and quoted down a phone line: `KWB-2026-7K4Q`. It is generated
  -- by the app, not the database, because the alphabet deliberately excludes
  -- 0/O/1/I/L — see `createOrderId`.
  order_id text primary key,
  created_at timestamptz not null,
  -- 'new' | 'whatsapp_opened' | 'confirmed'. Constrained, so a typo in application
  -- code cannot invent a fourth state the dashboard has no rendering for.
  status text not null check (status in ('new', 'whatsapp_opened', 'confirmed')),
  whatsapp_opened_at timestamptz,
  confirmed_at timestamptz,
  item_count integer not null,
  -- Rupees, integer. No floating point anywhere near money.
  subtotal integer not null,
  discount integer not null default 0,
  total integer not null,
  payload jsonb not null
);

-- `list()` is always newest-first, and it is the dashboard's only query.
create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

-- The dashboard's one operational question: which orders did nobody act on?
create index if not exists orders_status_idx
  on public.orders (status, created_at desc);

alter table public.orders enable row level security;

-- ── Settings ───────────────────────────────────────────────────────────────────
--
-- Key/value, because that is what it is: a handful of editable values with no
-- relationships. `promo_tape` is the only key today. A column per setting would mean
-- a migration every time the shop wants a new toggle, which is exactly the friction
-- the admin panel exists to remove.
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

-- ── Rate limits ────────────────────────────────────────────────────────────────
--
-- Replaces an in-memory `Map` in `app/api/orders/route.ts`. On a serverless host
-- each instance had its own copy, so "12 orders per 10 minutes" was per-instance and
-- a limit in name only.
--
-- `key_hash` is a salted SHA-256 of the client IP, never the IP itself. The table
-- only ever needs to answer "have I seen this caller before", which a hash answers;
-- storing the address would add personal data to a table that exists purely to
-- count, and it is the one table most likely to be kept indefinitely.
create table if not exists public.rate_limits (
  id bigint generated always as identity primary key,
  -- Which limiter. One table serves all of them rather than one table each.
  bucket text not null,
  key_hash text not null,
  hit_at timestamptz not null default now()
);

create index if not exists rate_limits_lookup_idx
  on public.rate_limits (bucket, key_hash, hit_at desc);

-- Old rows are dead weight. The app deletes opportunistically, and this index makes
-- that sweep cheap.
create index if not exists rate_limits_hit_at_idx
  on public.rate_limits (hit_at);

alter table public.rate_limits enable row level security;

-- ── Optional: let Postgres do the sweeping ─────────────────────────────────────
--
-- The app prunes `rate_limits` opportunistically, which is enough on low traffic. If
-- the table ever grows, enable pg_cron in the Supabase dashboard and schedule this
-- instead — it is cheaper than pruning on the request path:
--
--   select cron.schedule(
--     'prune-rate-limits', '0 * * * *',
--     $$delete from public.rate_limits where hit_at < now() - interval '1 day'$$
--   );
