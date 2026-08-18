/**
 * Cross-checks every static asset path referenced in source against public/.
 * Run: node scripts/check-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ASSET_RE = /["'`](\/[\w\-/.]+\.(?:svg|jpg|jpeg|png|webp|avif|mp4|webm|ico))["'`]/g;
const refs = new Map(); // asset path -> first source file that mentions it

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!/^(node_modules|\.next|\.git)$/.test(entry.name)) walk(full);
      continue;
    }
    if (!/\.(ts|tsx|mjs|js|jsx)$/.test(entry.name)) continue;
    const source = fs.readFileSync(full, "utf8");
    for (const match of source.matchAll(ASSET_RE)) {
      if (!refs.has(match[1])) refs.set(match[1], full);
    }
  }
}

for (const dir of ["data", "components", "app", "lib"]) {
  if (fs.existsSync(dir)) walk(dir);
}

const missing = [...refs].filter(([asset]) => !fs.existsSync(path.join("public", asset)));

console.log(`referenced: ${refs.size}  missing: ${missing.length}`);
for (const [asset, source] of missing) console.log(`  MISSING ${asset}  <- ${source}`);
process.exit(missing.length > 0 ? 1 : 0);
