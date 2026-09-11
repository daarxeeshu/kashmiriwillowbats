import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  PROMO_TAPE_DEFAULTS,
  sanitisePromoTape,
  type PromoTapeSettings,
} from "@/data/promo-tape";

/* ── Editable site settings ──────────────────────────────────────────────────────
 *
 * The same shape and the same caveats as `lib/orders/store.ts`, and for the same
 * reason: this file is the whole storage layer and it exists to be replaced. Anything
 * above it talks only to `settingsStore`, so moving to a real table means rewriting
 * this file and nothing else.
 *
 * ── What this is not ──
 * It is not a database, and it will not survive deployment. Vercel's filesystem is
 * per-request and discarded, so a JSON file there stores nothing and the tape would
 * read its defaults on every cold start. That is fine while the site runs locally,
 * and it is why the interface below is the shape a settings row is queried with
 * rather than the shape a file is convenient with.
 *
 * ── Why this file is *not* the orders file ──
 * Orders are customer data — names, phone numbers, addresses — and `.data/orders.json`
 * is gitignored for that reason. These are three lines of marketing copy with nothing
 * private in them. Keeping them apart means the settings can be inspected, copied
 * between environments or committed one day without dragging personal data along.
 */

interface SettingsStoreShape {
  getPromoTape(): Promise<PromoTapeSettings>;
  /** Returns what was actually stored, which is the sanitised value rather than the
   *  one supplied — so the caller can render the truth instead of what it asked for. */
  savePromoTape(settings: unknown): Promise<PromoTapeSettings>;
}

/* ── Local JSON implementation ── */

const DATA_DIR = join(process.cwd(), ".data");
const SETTINGS_FILE = join(DATA_DIR, "settings.json");

interface SettingsFile {
  promoTape?: unknown;
}

/* One in-flight write at a time. Two admins saving in the same second would otherwise
 * read the same object, each change one key, and the second write would land on top of
 * the first — losing a change silently. */
let queue: Promise<unknown> = Promise.resolve();
function serialise<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.then(work, work);
  // Keep the chain alive even when a link rejects, or one failed write stops all
  // later ones.
  queue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function readAll(): Promise<SettingsFile> {
  try {
    const raw = await readFile(SETTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (error) {
    // A missing file is the normal first-run state. Corrupt JSON is not, but the
    // honest response for *decoration* is still the defaults rather than a 500 on
    // the homepage — so it is logged and swallowed here, where the alternative is a
    // blank storefront because a slogan file had a stray comma.
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return {};
    console.warn("[settings] could not read settings.json, using defaults", error);
    return {};
  }
}

async function writeAll(settings: SettingsFile): Promise<void> {
  await mkdir(dirname(SETTINGS_FILE), { recursive: true });
  /* Write beside the target and rename over it. A crash midway through a direct write
   * leaves a truncated file; rename is atomic, so the file is either the old settings
   * or the new ones. */
  const temp = `${SETTINGS_FILE}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(settings, null, 2), "utf8");
  await rename(temp, SETTINGS_FILE);
}

export const fileSettingsStore: SettingsStoreShape = {
  async getPromoTape() {
    const file = await readAll();
    // Sanitised on read as well as on write: a file hand-edited between deploys, or
    // written by an earlier version of the shape, resolves to something renderable.
    return file.promoTape === undefined
      ? PROMO_TAPE_DEFAULTS
      : sanitisePromoTape(file.promoTape);
  },

  async savePromoTape(settings) {
    return serialise(async () => {
      const clean = sanitisePromoTape(settings);
      const file = await readAll();
      await writeAll({ ...file, promoTape: clean });
      return clean;
    });
  },
};
