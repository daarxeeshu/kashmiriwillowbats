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

/* `getWhatsAppNumber()` is `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
   siteConfig.whatsappNumber`, so checking only the variable answers the wrong
   question: the site ships with a working business number in code and the variable
   is an override for staging. An earlier version of this check warned that CTAs
   "fall back to /contact" whenever the variable was unset, which was simply untrue
   and would have sent someone hunting for a problem that did not exist.

   So resolve it the same way the app does, and report on the result. */
const envNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
let codeNumber = "";
try {
  const config = readFileSync("data/site-config.ts", "utf8");
  codeNumber = (config.match(/whatsappNumber:\s*"([^"]*)"/)?.[1] ?? "").replace(
    /\D/g,
    "",
  );
} catch {
  /* Reported by the domain check below; not worth two messages. */
}

const source = envNumber
  ? "NEXT_PUBLIC_WHATSAPP_NUMBER"
  : "data/site-config.ts fallback";
const resolved = envNumber || codeNumber;

if (envNumber && envNumber.length < 10) {
  /* The variable wins over the fallback, so a malformed override is worse than no
     override: it replaces a working number with a broken one. */
  bad(`NEXT_PUBLIC_WHATSAPP_NUMBER has ${envNumber.length} digits, needs 10+`);
  note("It overrides the working number in site-config, so a malformed value here");
  note("turns every live CTA into a wa.me link that opens a WhatsApp error.");
} else if (resolved.length < 10) {
  bad("no usable WhatsApp number from either the environment or site-config");
  note("Every CTA falls back to /contact. This is how the shop takes orders.");
} else {
  ok(`WhatsApp number resolves (${resolved.length} digits, from ${source})`);
  if (!envNumber) {
    note("No override set, so the number compiled into site-config is the live one.");
  }
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
  /* Length alone is not strength, and checking only length is how a 29-character
     password reading "test-only-not-a-real-password" passed this check while
     guarding a table of customer names, phone numbers and home addresses on a
     public repo. A placeholder is worse than a short password: a short one at least
     has to be brute-forced. */
  const placeholder =
    /test|example|placeholder|changeme|change-me|password|secret|admin|demo|dummy|foo|bar|sample|not-a-real|temp|qwerty|123456/i.test(
      adminPassword,
    );

  if (placeholder) {
    bad("ADMIN_PASSWORD looks like a placeholder, not a password");
    note("/admin/orders exposes customer names, phone numbers and addresses, and");
    note("middleware.ts is readable by anyone if the repo is public — so the");
    note("password is the only thing protecting it. Generate a real one:");
    note("  node -e \"console.log(require('crypto').randomBytes(24).toString('base64url'))\"");
  } else if (adminPassword.length < 20) {
    warn(`admin password is ${adminPassword.length} chars — prefer 24+`);
    note("HTTP Basic sends it on every request, so length is the main defence.");
  } else {
    ok(`admin credentials set (password ${adminPassword.length} chars)`);
  }

  if (/^(admin|owner|root|user|test|demo)$/i.test(adminUser)) {
    /* Not a failure on its own — Basic auth needs both halves and the password is
       what carries the weight. Worth saying, because a guessable username halves
       the work and costs nothing to change. */
    warn(`ADMIN_USER is "${adminUser}" — a guessable default`);
    note("Basic auth compares both halves; an unguessable username is free entropy.");
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
