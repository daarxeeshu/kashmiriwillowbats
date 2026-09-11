import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Order, OrderStatus } from "@/types/cart";

/* ── Where orders live ───────────────────────────────────────────────────────────
 *
 * This file is the whole storage layer, and it exists to be replaced. Everything
 * above it — the API route, the dashboard, the status transitions — talks only to
 * `orderStore`, so moving to Supabase means rewriting this file and nothing else.
 *
 * ── Why every method is async ──
 * Reading a JSON file could be synchronous and this would be simpler. It is not,
 * because Supabase's client is asynchronous, and a synchronous interface here would
 * mean every caller changes shape on the day we switch. The awkwardness belongs in
 * this file rather than in the eight places that call it.
 *
 * ── What this is not ──
 * It is not a database, and it will not survive deployment. Vercel's filesystem is
 * per-request and discarded, so a JSON file there stores nothing. That is fine while
 * the site runs locally and is exactly why the interface below is narrow: it is the
 * shape a real table is queried with, not the shape a file is convenient with.
 *
 * ── The file is customer data ──
 * Names, phone numbers and home addresses. It is written outside `public/` — a file
 * under `public/` is served to anyone who guesses the URL — and it is in .gitignore,
 * because the alternative is committing personal data to a repository that is about
 * to be pushed to GitHub.
 */

interface OrderStoreShape {
  save(order: Order): Promise<void>;
  get(orderId: string): Promise<Order | null>;
  /** Newest first. `limit` caps the page; the dashboard asks for a page at a time
   *  rather than the table. */
  list(options?: { limit?: number }): Promise<Order[]>;
  /** Returns the updated order, or null when there is no such order. The caller
   *  decides which transitions are legal — this only writes. */
  setStatus(
    orderId: string,
    status: OrderStatus,
    at: string,
  ): Promise<Order | null>;
}

/* ── Local JSON implementation ── */

const DATA_DIR = join(process.cwd(), ".data");
const ORDERS_FILE = join(DATA_DIR, "orders.json");

/* One in-flight write at a time. Two orders placed in the same second would
 * otherwise read the same array, each append one line, and the second write would
 * land on top of the first — losing an order silently, which is the exact failure
 * this whole feature exists to stop. */
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

async function readAll(): Promise<Order[]> {
  try {
    const raw = await readFile(ORDERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch (error) {
    // A missing file is the normal first-run state, not a problem. Anything else —
    // corrupt JSON, a permission error — must not be swallowed into "no orders",
    // because that would present an empty dashboard as though nobody had ordered.
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    throw error;
  }
}

async function writeAll(orders: Order[]): Promise<void> {
  await mkdir(dirname(ORDERS_FILE), { recursive: true });
  /* Write beside the target and rename over it. A crash midway through a direct
   * write leaves a truncated file and every order is gone; rename is atomic, so the
   * file is either the old list or the new one. */
  const temp = `${ORDERS_FILE}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(orders, null, 2), "utf8");
  await rename(temp, ORDERS_FILE);
}

export const fileOrderStore: OrderStoreShape = {
  async save(order) {
    await serialise(async () => {
      const orders = await readAll();
      orders.push(order);
      await writeAll(orders);
    });
  },

  async get(orderId) {
    const orders = await readAll();
    return orders.find((o) => o.orderId === orderId) ?? null;
  },

  async list(options) {
    const orders = await readAll();
    const newestFirst = [...orders].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    return options?.limit ? newestFirst.slice(0, options.limit) : newestFirst;
  },

  async setStatus(orderId, status, at) {
    return serialise(async () => {
      const orders = await readAll();
      const index = orders.findIndex((o) => o.orderId === orderId);
      if (index === -1) return null;

      const updated: Order = {
        ...orders[index],
        status,
        whatsappOpenedAt:
          status === "whatsapp_opened"
            ? (orders[index].whatsappOpenedAt ?? at)
            : orders[index].whatsappOpenedAt,
        confirmedAt:
          status === "confirmed" ? (orders[index].confirmedAt ?? at) : orders[index].confirmedAt,
      };
      orders[index] = updated;
      await writeAll(orders);
      return updated;
    });
  },
};
