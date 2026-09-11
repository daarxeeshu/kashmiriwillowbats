# Deploying to Vercel

Everything below is either already in the repo or a value you set once in the Vercel
dashboard. Run `npm run preflight` before and after the first deploy — it checks the
things that are easy to get wrong and silent when they are wrong.

## 1. Environment variables

Vercel → Project → **Settings → Environment Variables**. Add each to **Production**
(and Preview, if you want previews to work against the same data — see the warning).

| Variable | Value | Why |
| --- | --- | --- |
| `SUPABASE_URL` | `https://smvzniwcxhakxkhbsadt.supabase.co` | Not a secret; ships in client bundles on most Supabase apps. |
| `SUPABASE_SERVICE_ROLE_KEY` | the `sb_secret_…` key | **Secret.** Bypasses row-level security. Never `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `91XXXXXXXXXX` | Country code, digits only. Every WhatsApp CTA resolves through it. |
| `ADMIN_USER` | your choice | `/admin` is HTTP Basic. |
| `ADMIN_PASSWORD` | long and random | Sent on every admin request, so HTTPS is mandatory. |
| `RATE_LIMIT_SALT` | optional, long random | Keys the HMAC in `rate_limits`. Falls back to the service-role key. |

**On Preview environments:** if you give Preview the same `SUPABASE_*` values, every
preview deploy writes to your live orders table. Either accept that, or create a
second Supabase project for Preview and point it there. Leaving them unset is the one
thing not to do — the app would fall back to the filesystem, and Vercel discards it.
`assertOrderStoreIsDurable` turns that into a refused order rather than a lost one,
which is the right failure, but it does mean checkout is broken on previews.

## 2. What the repo already handles

- **`vercel.json` pins `regions: ["bom1"]`** — Mumbai. Server components and route
  handlers query Supabase on every request, and the database is in `ap-south-1`.
  Without this, functions default to a US region and each query crosses the Atlantic
  and back for no reason. Same continent, single-digit milliseconds.
- **Security headers live in `next.config.ts`**, not here. Vercel honours both, but
  headers declared there also apply to `next dev` and `next start`, which means the
  Content-Security-Policy could be tested before it shipped. A CSP is the worst thing
  to ship untested: when it is too strict nothing throws, the browser just quietly
  refuses to load whatever the policy forgot.
- **No `DATABASE_URL`.** The app talks to Supabase over its REST API with the
  service-role key, not over a Postgres connection. There is no connection pool to
  size and no pooler URL to choose.

## 3. Domain

`data/site-config.ts` sets `url: "https://kashmiriwillowbats.com"`, and that single
value drives `metadataBase`, the canonical tag on every page, the Open Graph URL,
the `sitemap` line in `robots.txt`, and all 140 sitemap entries. If the live domain
ever differs, change it there and nowhere else.

In Vercel: **Settings → Domains** → add `kashmiriwillowbats.com` and
`www.kashmiriwillowbats.com`, then set one as the redirect target so the canonical
tag and the served host agree. HTTPS and HSTS are automatic; the
`Strict-Transport-Security` header is already set to two years with `preload`.

## 4. After deploying

```bash
# Against the production environment, not your laptop.
vercel env pull .env.production.local
node --env-file=.env.production.local scripts/check-db.mjs
```

Then, on the live site:

1. `/` — the promo tape appears on the brand cards, light rays behind the studio card.
2. `/customize/3d` — the bat loads and an engraved name appears as you type. This is
   the page that proves the CSP allows `wasm-unsafe-eval`, without which the
   Draco-compressed mesh silently fails to load.
3. Place a real order, then check it in the Supabase table editor and at
   `/admin/orders`.
4. `/admin/promo-tape` should say **"Saved to Supabase"**. If it shows the amber
   "Saving to a local file" warning, the environment variables did not reach the
   runtime.

## 5. Known gap

The 3D bat mesh (`public/configurator/models/kis-bat.glb`) is Rohit Pawar's
"Cricket Bat(Sports)" from Sketchfab under **CC-BY-4.0**, and its attribution was
removed from the UI. The licence permits commercial use *with* attribution, so this
is fixable either by restoring a credit line or by replacing the mesh — but it is a
licence breach as it stands. Resolve before launch.
