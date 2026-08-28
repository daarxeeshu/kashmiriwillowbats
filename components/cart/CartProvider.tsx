"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { CartEntry, CartLine, CartTotals } from "@/types/cart";
import { CART_STORAGE_KEY, readCart, writeCart } from "@/lib/cart/storage";
import {
  cartTotals,
  clampQty,
  resolveCart,
  resolvedLineKey,
} from "@/lib/cart/totals";
import { normaliseEngraving } from "@/data/bat-options";

interface CartContextValue {
  lines: CartLine[];
  entries: CartEntry[];
  totals: CartTotals;
  /** False until the stored cart has been read. Everything that renders a count must
   *  wait for it — see below. */
  ready: boolean;
  add: (
    slug: string,
    qty?: number,
    spec?: { options?: Record<string, string>; engraving?: string },
  ) => void;
  /* Keyed by line, not by slug — the same bat in two specs is two lines, and a
     stepper on one of them must not move the other. */
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/* ── localStorage as an external store ───────────────────────────────────────────
 *
 * The cart lives in localStorage, which the server cannot see, so the first client
 * render has to agree with the server's HTML or hydration breaks — and the stored cart
 * has to arrive immediately afterwards.
 *
 * `useSyncExternalStore` is built for exactly this: `getServerSnapshot` is what
 * hydration matches against, and React re-renders with the live snapshot right after.
 * The alternative — read it in a mount effect and `setState` — produces the same
 * result through a cascading render, which is what `react-hooks/set-state-in-effect`
 * objects to. It is also the pattern this codebase already uses for the reduced-motion
 * preference in `HeroSequence`.
 *
 * The catch is that `getSnapshot` must return a *stable reference* or React re-renders
 * forever. So the parsed cart is cached at module scope and only re-parsed when the
 * raw string actually changes.
 */

const EMPTY: CartLine[] = [];

let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY;

const listeners = new Set<() => void>();

/** Notify this tab. The `storage` event only fires in *other* tabs, so a local write
 *  has to announce itself. */
function emit() {
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab is the same cart: without this, two open tabs each hold their own copy
  // and whichever writes last silently wins.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    // Private mode and blocked site data throw on access, not just on write.
    return EMPTY;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedLines = readCart();
  }
  return cachedLines;
}

function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

/* `ready` through the same mechanism: false on the server and during hydration, true
   immediately after. It is what lets a consumer tell "the cart is empty" from "we have
   not looked yet" — the difference between a considered empty state and flashing one
   at somebody who has three items. */
const neverChanges = () => () => {};

function useHydrated(): boolean {
  return useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useHydrated();

  /** Write, invalidate the cache, and tell this tab. */
  const commit = useCallback((next: CartLine[]) => {
    writeCart(next);
    cachedRaw = JSON.stringify(next);
    cachedLines = next;
    emit();
  }, []);

  const add = useCallback(
    (
      slug: string,
      qty = 1,
      spec?: { options?: Record<string, string>; engraving?: string },
    ) => {
      const line: CartLine = {
        slug,
        qty: clampQty(qty),
        options: spec?.options,
        engraving: normaliseEngraving(spec?.engraving ?? "") || undefined,
      };
      const key = resolvedLineKey(line);
      const current = getSnapshot();

      // Adding the same bat in the same spec increments; a different spec starts a new
      // line rather than overwriting the first.
      const existing = current.find((l) => resolvedLineKey(l) === key);
      commit(
        existing
          ? current.map((l) =>
              resolvedLineKey(l) === key ? { ...l, qty: clampQty(l.qty + qty) } : l,
            )
          : [...current, line],
      );
    },
    [commit],
  );

  const setQty = useCallback(
    (key: string, qty: number) => {
      const current = getSnapshot();
      commit(
        qty <= 0
          ? current.filter((l) => resolvedLineKey(l) !== key)
          : current.map((l) =>
              resolvedLineKey(l) === key ? { ...l, qty: clampQty(qty) } : l,
            ),
      );
    },
    [commit],
  );

  const remove = useCallback(
    (key: string) => {
      commit(getSnapshot().filter((l) => resolvedLineKey(l) !== key));
    },
    [commit],
  );

  const clear = useCallback(() => commit([]), [commit]);

  const entries = useMemo(() => resolveCart(lines), [lines]);
  const totals = useMemo(() => cartTotals(entries), [entries]);

  const value = useMemo(
    () => ({ lines, entries, totals, ready, add, setQty, remove, clear }),
    [lines, entries, totals, ready, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  // Throwing beats returning a no-op cart: a button that silently does nothing is far
  // harder to diagnose than a component that says it is outside the provider.
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
