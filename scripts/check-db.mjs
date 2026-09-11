#!/usr/bin/env node
/**
 * Is the database reachable, and is the schema there?
 *
 *   npm run db:check
 *
 * Prints a verdict and nothing sensitive. The service-role key is never echoed —
 * only whether it is present and how it behaves — so the output of this script is
 * safe to paste into a chat, an issue, or a screen share. That is the whole reason
 * it exists rather than a one-off `node -e`.
 *
 * Exit code is 0 when everything is ready and 1 when something needs attention, so
 * it can gate a deploy.
 */

import { createClient } from "@supabase/supabase-js";

const URL_VAR = "SUPABASE_URL";
const KEY_VAR = "SUPABASE_SERVICE_ROLE_KEY";

const url = process.env[URL_VAR];
const key = process.env[KEY_VAR];

const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => console.log(`  ✗ ${m}`);
const note = (m) => console.log(`    ${m}`);

console.log("\nSupabase check\n");

/* ── 1. Environment ─────────────────────────────────────────────────────────── */

if (!url || !key) {
  bad("Not configured.");
  if (!url) note(`${URL_VAR} is not set`);
  if (!key) note(`${KEY_VAR} is not set`);
  note("");
  note("The app falls back to JSON files under .data/ without these, which is");
  note("fine locally and loses every order on Vercel/Netlify/Lambda.");
  note("Add them to .env.local — see .env.example.");
  process.exit(1);
}

// Shape, not content. A pasted anon key here is the most likely mistake and it is
// silently wrong: it can read nothing, so every query returns empty rather than
// failing, and orders would appear to save and never show up.
let host = "(unparseable)";
try {
  host = new URL(url).host;
} catch {
  bad(`${URL_VAR} is not a valid URL: ${JSON.stringify(url)}`);
  process.exit(1);
}
ok(`${URL_VAR} -> https://${host}`);

/* Supabase has two key formats in the wild, and the wrong key in either of them
   fails the same silent way: RLS denies it on all three tables, so reads come back
   empty and writes fail — orders appear to save and never arrive. Worth catching by
   name here rather than debugging an empty dashboard later.

     new    sb_publishable_... / sb_secret_...   (opaque, not JWTs)
     legacy anon / service_role                  (JWTs with a `role` claim) */
let keyKind = "unrecognised";

if (key.startsWith("sb_publishable_")) {
  bad(`${KEY_VAR} is the publishable key, not a secret key.`);
  note("Publishable keys are for browsers and are denied by row-level security on");
  note("every table here. In Project Settings -> API Keys, use the one under");
  note('"Secret keys" (sb_secret_...) — click the eye to reveal it.');
  process.exit(1);
}

if (key.startsWith("sb_secret_")) {
  keyKind = "secret key (new format)";
} else if (key.split(".").length === 3) {
  let role = null;
  try {
    role = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role;
  } catch {
    /* A three-part string that is not a JWT. Fall through to the probe. */
  }
  if (role && role !== "service_role") {
    bad(`${KEY_VAR} is a "${role}" key, not the service-role key.`);
    note("Row-level security denies that role on every table, so reads would come");
    note("back empty and writes would fail. Copy the `service_role` key from");
    note("Project Settings -> API.");
    process.exit(1);
  }
  keyKind = role ? `legacy ${role} key` : "legacy JWT";
}

ok(`${KEY_VAR} present (${key.length} chars, ${keyKind})`);
if (keyKind === "unrecognised") {
  note("Format not recognised — continuing, since the probe below is the real test.");
}

/* ── 2. Connectivity and schema ─────────────────────────────────────────────── */

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TABLES = ["orders", "settings", "rate_limits"];
let failures = 0;

console.log("");
for (const table of TABLES) {
  const started = Date.now();
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  const ms = Date.now() - started;

  if (error) {
    failures++;
    bad(`${table.padEnd(12)} ${error.message}`);
    if (/does not exist|schema cache/i.test(error.message)) {
      note("Run supabase/migrations/0001_init.sql in the SQL Editor.");
    }
    continue;
  }
  ok(`${table.padEnd(12)} ${count} row${count === 1 ? "" : "s"}  (${ms} ms)`);
}

/* ── 3. Can it actually write? ──────────────────────────────────────────────── */

if (failures === 0) {
  console.log("");
  const probe = `__check_${Date.now()}`;
  const { error: writeError } = await supabase
    .from("settings")
    .upsert({ key: probe, value: { probe: true } }, { onConflict: "key" });

  if (writeError) {
    failures++;
    bad(`write failed: ${writeError.message}`);
  } else {
    // Cleaned up immediately — a check must not leave rows behind.
    const { error: deleteError } = await supabase
      .from("settings")
      .delete()
      .eq("key", probe);
    if (deleteError) {
      bad(`wrote a probe row but could not remove it: ${probe}`);
      failures++;
    } else {
      ok("read/write confirmed (probe row written and removed)");
    }
  }
}

console.log("");
if (failures > 0) {
  console.log(`Not ready: ${failures} problem${failures === 1 ? "" : "s"} above.\n`);
  process.exit(1);
}
console.log("Ready. Orders and settings will persist in Postgres.\n");
