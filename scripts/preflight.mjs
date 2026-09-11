#!/usr/bin/env node
/**
 * Is this environment ready to serve the shop?
 *
 *   npm run preflight                                  # against .env.local
 *   node --env-file=.env.production.local scripts/preflight.mjs
 *
 * Checks configuration only — no network calls, so it is fast and works offline.
 * `npm run db:check` is the companion that actually talks to Supabase.
 *
 * Nothing sensitive is printed: secrets are reported as present/absent and by
 * length, never by value, so the output is safe to paste anywhere. Exit code is 1
 * when anything is wrong, so it can gate a deploy.
 */

import { readFileSync } from "node:fs";

const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => {
  problems++;
  console.log(`  ✗ ${m}`);
};
const warn = (m) => {
  warnings++;
  console.log(`  ! ${m}`);
};
const note = (m) => console.log(`    ${m}`);

let problems = 0;
let warnings = 0;

/* An ephemeral filesystem is the thing that makes a misconfiguration dangerous
   rather than merely untidy, so the verdict below is stricter when we can tell we
   are on one. */
const ephemeral = Boolean(
  process.env.VERCEL ?? process.env.NETLIFY ?? process.env.AWS_LAMBDA_FUNCTION_NAME,
);

console.log("\nPreflight\n");
console.log(
  `  host: ${ephemeral ? "serverless (ephemeral filesystem)" : "long-lived process"}`,
);
console.log("");

/* ── Database ───────────────────────────────────────────────────────────────── */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && supabaseKey) {
  try {
    ok(`SUPABASE_URL -> ${new URL(supabaseUrl).host}`);
  } catch {
    bad(`SUPABASE_URL is not a valid URL`);
  }

  if (supabaseKey.startsWith("sb_publishable_")) {
    bad("SUPABASE_SERVICE_ROLE_KEY is the publishable key, not a secret key");
    note("Row-level security denies it on every table: reads return empty and");
    note("writes fail, so orders appear to save and never arrive.");
  } else {
    ok(`SUPABASE_SERVICE_ROLE_KEY present (${supabaseKey.length} chars)`);
  }

  // The one that would put a service-role key in a browser bundle.
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    bad("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is set — remove it immediately");
    note("The NEXT_PUBLIC_ prefix inlines a value into client JavaScript. This key");
    note("bypasses row-level security and can read every customer's address.");
  }
} else if (ephemeral) {
  bad("Supabase is not configured, and this host discards its filesystem");
  note("Every order would be written and lost. /api/orders refuses orders in this");
  note("state rather than losing them, so checkout is broken until you set");
  note("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
} else {
  warn("Supabase not configured — falling back to JSON files under .data/");
  note("Fine for local work. Set both variables before deploying.");
}

/* ── WhatsApp ───────────────────────────────────────────────────────────────── */

const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
if (!process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) {
  /* Not fatal: `whatsappHref` falls back to /contact, and the copy is written to
     stay honest when it does. Worth saying, because the shop takes its orders
     through WhatsApp and every CTA quietly becomes a contact link. */
  warn("NEXT_PUBLIC_WHATSAPP_NUMBER not set — CTAs fall back to /contact");
  note("The site is built to degrade honestly here, but this is how orders arrive.");
} else if (whatsapp.length < 10) {
  bad(`NEXT_PUBLIC_WHATSAPP_NUMBER has ${whatsapp.length} digits, needs 10+`);
  note("Country code first, digits only. A malformed number becomes a wa.me link");
  note("that looks like a working button and opens a WhatsApp error.");
} else {
  ok(`NEXT_PUBLIC_WHATSAPP_NUMBER set (${whatsapp.length} digits)`);
}

/* ── Admin ──────────────────────────────────────────────────────────────────── */

const adminUser = process.env.ADMIN_USER;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminUser || !adminPassword) {
  /* Deliberately not an error. With these unset the middleware serves nothing at
     all, which is the correct default — "we will add auth later" is how a customer
     database ends up public. */
  warn("ADMIN_USER / ADMIN_PASSWORD not set — /admin returns 503, by design");
  note("Set both to use the orders dashboard and the promo tape editor.");
} else {
  ok(`admin credentials set (password ${adminPassword.length} chars)`);
  if (adminPassword.length < 16) {
    warn(`admin password is ${adminPassword.length} chars — prefer 24+`);
    note("HTTP Basic sends it on every request. Length is the only defence.");
  }
}

/* ── Domain ─────────────────────────────────────────────────────────────────── */

try {
  const config = readFileSync("data/site-config.ts", "utf8");
  const match = config.match(/url:\s*"([^"]+)"/);
  if (!match) {
    warn("could not read `url` from data/site-config.ts");
  } else {
    const site = new URL(match[1]);
    if (site.protocol !== "https:") {
      bad(`site URL is ${site.protocol} — must be https`);
      note("/admin uses HTTP Basic and sends its password on every request.");
    } else if (match[1].endsWith("/")) {
      /* `${siteConfig.url}/sitemap.xml` would become a double slash, and the
         canonical tag would disagree with the served URL. */
      bad(`site URL has a trailing slash: ${match[1]}`);
    } else {
      ok(`site URL ${match[1]}`);
      note("drives metadataBase, canonicals, OG tags, robots and every sitemap URL");
    }
  }
} catch {
  warn("data/site-config.ts not readable from here — run from the project root");
}

/* ── Verdict ────────────────────────────────────────────────────────────────── */

console.log("");
if (problems > 0) {
  console.log(
    `Not ready: ${problems} problem${problems === 1 ? "" : "s"}` +
      (warnings ? `, ${warnings} warning${warnings === 1 ? "" : "s"}` : "") +
      ".\n",
  );
  process.exit(1);
}
if (warnings > 0) {
  console.log(
    `Usable, with ${warnings} warning${warnings === 1 ? "" : "s"} above.\n`,
  );
  process.exit(0);
}
console.log("Ready.\n");
