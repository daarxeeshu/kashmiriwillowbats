"use client";

/* ── Customise Your Bat 3D ───────────────────────────────────────────────────────
 *
 * React owns the configuration; `engine/studio.js` owns the WebGL context, the mesh
 * and the four canvases. The seam between them is one call — `studio.apply(payload,
 * changed)` — and `changed` is what keeps it fast: typing a name repaints a canvas,
 * while changing the profile walks every vertex, and the engine is told which of
 * those it needs to do.
 *
 * Everything the customer chooses is an id from `data/bat-options.ts`. That is the
 * load-bearing decision in this whole section: `sanitiseBatOptions` runs on the
 * server and replaces an id it does not recognise with the group's default, so a
 * studio with its own vocabulary would let someone configure a Duckbill and have the
 * workshop build an SRT, with nothing anywhere reporting a fault. See `geometry.ts`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  Loader2,
  RotateCcw,
  RotateCw,
  ShoppingBag,
  TriangleAlert,
} from "lucide-react";
import {
  BAT_OPTION_GROUPS,
  BAT_STUDIO_OPTION_GROUPS,
  ENGRAVING_MAX,
  describeBatOptions,
  engravingError,
  normaliseEngraving,
  sanitiseBatOptions,
} from "@/data/bat-options";
import { useCart } from "@/components/cart/CartProvider";
import { buttonClass } from "@/components/ui/Button";
import { siteConfig } from "@/data/site-config";
import { cn, formatPrice } from "@/lib/utils";
import {
  ALL_CONFIG_KEYS,
  changedKeys,
  defaultConfig,
  enginePayload,
  reconcile,
  toCartOptions,
  type StudioConfig,
} from "./config";
import {
  ENGRAVE_PLACEMENTS,
  ENGRAVE_SIZE,
  GRIP_COLOUR,
  STICKER_ART,
  groupById,
  weightsForSize,
} from "./geometry";
import {
  DEFAULT_STUDIO_SLUG,
  studioProductBySlug,
  studioProducts,
} from "./studio-products";

type Status = "loading" | "ready" | "failed";

const VIEWS = [
  { id: "full", label: "Full bat" },
  { id: "face", label: "Face" },
  { id: "engrave", label: "Engraving" },
  { id: "edge", label: "Edge" },
  { id: "back", label: "Spine" },
] as const;

interface Measured {
  spineMm: number;
  edgeMm: number;
  widthMm: number;
}

interface BatStudioProps {
  /** The family `next/font` generated for the condensed face, so the burn canvas
   *  draws the letterforms the laser will actually cut. */
  blockFontFamily?: string;
}

export function BatStudio({ blockFontFamily }: BatStudioProps) {
  const { add } = useCart();
  const hostRef = useRef<HTMLDivElement>(null);
  /* Typed loosely on purpose: `engine/` is plain JavaScript, excluded from
     `tsconfig.json`'s `include`, so there is no declaration to import. The seam is
     four method calls wide and each one is exercised below. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const studioRef = useRef<any>(null);
  const appliedRef = useRef<StudioConfig | null>(null);
  const dragStartRef = useRef<StudioConfig | null>(null);

  const [config, setConfig] = useState<StudioConfig>(() =>
    defaultConfig(DEFAULT_STUDIO_SLUG),
  );
  const [past, setPast] = useState<StudioConfig[]>([]);
  const [future, setFuture] = useState<StudioConfig[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Preparing your bat…");
  const [measured, setMeasured] = useState<Measured | null>(null);
  const [millimetres, setMillimetres] = useState<{
    fromToe: number;
    across: number;
    capHeight: number;
  } | null>(null);
  const [view, setView] = useState<string>("full");
  const [addedSpec, setAddedSpec] = useState<string | null>(null);

  /* The live configuration, for callbacks the engine holds. The placement controller
     is constructed once during load and keeps whatever closure it was given, so it
     has to read through a ref or it would drag against a stale bat. */
  const configRef = useRef(config);
  /* Written in an effect, not during render. `react-hooks/refs` is right to flag the
     direct assignment: a ref mutated during render is read by whatever renders next,
     which under concurrent rendering is not necessarily this pass. The placement
     controller only reads this from pointer handlers after mount, so an effect is
     both correct and sufficient. */
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const product = studioProductBySlug(config.slug);

  /* ── Editing ───────────────────────────────────────────────────────────────── */

  /** Every change goes through here. `history: false` is for the drag: a pointer move
   *  is not an undo step, so the whole gesture is snapshotted once at pointerdown and
   *  committed once at pointerup. */
  const update = useCallback(
    (patch: Partial<StudioConfig>, { history = true }: { history?: boolean } = {}) => {
      setConfig((current) => {
        const next = reconcile({ ...current, ...patch });
        if (history) {
          setPast((p) => [...p.slice(-49), current]);
          setFuture([]);
        }
        return next;
      });
    },
    [],
  );

  const updateEngrave = useCallback(
    (
      patch: Partial<StudioConfig["engrave"]>,
      options: { history?: boolean } = {},
    ) => {
      setConfig((current) => {
        const next = reconcile({
          ...current,
          engrave: { ...current.engrave, ...patch },
        });
        if (options.history !== false) {
          setPast((p) => [...p.slice(-49), current]);
          setFuture([]);
        }
        return next;
      });
    },
    [],
  );

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      setFuture((f) => [configRef.current, ...f]);
      setConfig(previous);
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      setPast((p) => [...p, configRef.current]);
      setConfig(f[0]);
      return f.slice(1);
    });
  }, []);

  /* ── Boot ──────────────────────────────────────────────────────────────────── */

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let studio: { dispose: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        // Dynamic, so three.js and the engine are fetched only by this section and
        // never enter the bundle every other page of the shop loads.
        const [{ BatStudio: Engine }, { setEngraveFontFamily }] = await Promise.all([
          import("./engine/studio.js"),
          import("./engine/fonts.js"),
        ]);
        if (cancelled) return;
        if (blockFontFamily) setEngraveFontFamily("block", blockFontFamily);

        const engine = new Engine(host, {
          onProgress: (p: number, text: string) => {
            setProgress(p);
            if (text) setMessage(text);
          },
          onPlacement: ({
            u,
            v,
            face,
          }: {
            u: number;
            v: number;
            face: "front" | "back";
          }) => updateEngrave({ pos: { u, v }, face }, { history: false }),
          onPlacementStart: () => {
            dragStartRef.current = configRef.current;
          },
          onPlacementEnd: () => {
            // One undo step for the whole drag, taken from the snapshot rather than
            // from the run of intermediate positions.
            const before = dragStartRef.current;
            dragStartRef.current = null;
            if (before && before !== configRef.current) {
              setPast((p) => [...p.slice(-49), before]);
              setFuture([]);
            }
          },
        });
        studio = engine;
        studioRef.current = engine;

        /* A handle on the engine in development only.
         *
         * The renderer is created without `preserveDrawingBuffer`, so the WebGL
         * canvas reads back as fully transparent outside its own frame — there is no
         * way to inspect what the customer is looking at from the outside. This is
         * how the burn canvases, the measured cross sections and the projection
         * uniforms are checked. Stripped from a production build by the constant
         * folding on `process.env.NODE_ENV`. */
        if (process.env.NODE_ENV !== "production") {
          (window as unknown as { __batStudio?: unknown }).__batStudio = engine;
        }

        await engine.load();
        if (cancelled) return;

        const current = configRef.current;
        const owner = studioProductBySlug(current.slug);
        engine.apply(
          enginePayload(current, {
            name: owner?.name ?? "",
            willow: owner?.willow ?? "kashmir",
          }),
          ALL_CONFIG_KEYS,
        );
        appliedRef.current = current;
        engine.setView("full", false);
        setMeasured(engine.measureBlade());
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("[bat-studio] could not start", error);
        setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
      studioRef.current = null;
      appliedRef.current = null;
      // A WebGL context is not collected on unmount and a browser keeps only a
      // handful alive; without this, navigating in and out of the studio a few times
      // brings the canvas back blank.
      studio?.dispose();
    };
    // Mount once. `updateEngrave` is stable and the font family is fixed per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Configuration → mesh ──────────────────────────────────────────────────── */

  useEffect(() => {
    const engine = studioRef.current;
    if (!engine || status !== "ready") return;

    const previous = appliedRef.current;
    const changed = previous ? changedKeys(previous, config) : ALL_CONFIG_KEYS;
    if (changed.length === 0) return;

    const owner = studioProductBySlug(config.slug);
    engine.apply(
      enginePayload(config, {
        name: owner?.name ?? "",
        willow: owner?.willow ?? "kashmir",
      }),
      changed,
    );
    appliedRef.current = config;

    // Only re-measure when the blade actually moved. `measureBlade` walks every
    // vertex, and a keystroke must not pay for it.
    if (
      changed.some((key) =>
        ["profile", "edge", "toe", "weight", "size"].includes(key as string),
      )
    ) {
      setMeasured(engine.measureBlade());
    }

    /* The engraving's position in millimetres, taken from the mesh right after it
       was updated. This is the only moment both facts are true at once — the blade
       is at its final shape and the engraving is at its final place — which is why
       it is written here rather than derived during render. */
    setMillimetres(engine.engraveMillimetres(config.engrave));
  }, [config, status]);

  /* ── Derived ───────────────────────────────────────────────────────────────── */

  const engraveText = normaliseEngraving(config.engrave.text);
  const engraveProblem = engravingError(config.engrave.text);
  const hasEngraving = config.engrave.on && engraveText.length > 0;
  const engravingFree =
    (product?.price ?? 0) >= siteConfig.engraving.freeThreshold;

  /* Measured off the mesh the customer is looking at, because the same blade-space
     position is a different number of millimetres on a size 3 and a short handle.
     
     State rather than a `useMemo` over `studioRef.current`. Deriving it from a ref
     during render was a real fragility as well as a lint error: a ref does not
     trigger a re-render when it fills in, so the figure only appeared because
     `measured` happened to change at the same moment. It is now written from the
     effect below, which is the one place that knows the mesh has been updated. */

  const cartOptions = useMemo(
    () => toCartOptions(config, millimetres),
    [config, millimetres],
  );

  /* What the workshop will read, resolved through the same function the server uses.
     Showing the customer the *sanitised* spec rather than the raw one means anything
     that would not survive validation is visible here rather than discovered on a
     bench in Sangam. */
  const workshopSpec = useMemo(
    () =>
      describeBatOptions(
        sanitiseBatOptions(cartOptions, product?.categorySlug ?? "") ?? undefined,
      ),
    [cartOptions, product?.categorySlug],
  );

  const currentSpec = JSON.stringify([config.slug, cartOptions, engraveText]);
  const added = addedSpec === currentSpec;

  const onAdd = useCallback(() => {
    if (!product) return;
    add(product.slug, 1, {
      options: cartOptions,
      engraving: hasEngraving ? engraveText : undefined,
    });
    setAddedSpec(currentSpec);
  }, [add, cartOptions, currentSpec, engraveText, hasEngraving, product]);

  const changeView = useCallback((id: string) => {
    setView(id);
    studioRef.current?.setView(id);
  }, []);

  const weightValues = weightsForSize(config.size);

  /* ── Render ────────────────────────────────────────────────────────────────── */

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
      {/* ── Stage ──
          Sticky and capped to the viewport on a wide screen. Without `items-start`
          the grid stretches both columns to the taller one, and the panel is a long
          list of controls — the stage was rendering 1206px tall, so the bat was
          bigger than the window and scrolled away the moment anyone reached for an
          option. Keeping it in view is the whole point of configuring in 3D. */}
      <div className="relative min-h-[460px] overflow-hidden rounded-sm border border-border bg-surface-dark lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:min-h-[560px]">
        <div
          ref={hostRef}
          className="absolute inset-0 touch-none [&>canvas]:block [&>canvas]:size-full"
        />

        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-dark/90">
            <Loader2 aria-hidden="true" className="size-5 animate-spin text-accent" />
            <div className="h-0.5 w-40 overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-accent transition-[width] duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p role="status" className="text-xs text-muted-foreground">
              {message}
            </p>
          </div>
        )}

        {status === "failed" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <TriangleAlert aria-hidden="true" className="size-6 text-danger" />
            <p className="text-sm font-medium text-foreground">
              The 3D studio could not start on this device.
            </p>
            {/* Said plainly, with the way out. A browser without WebGL is not a fault
                the customer can fix, and the shop still has to be able to take the
                order. */}
            <p className="max-w-sm text-xs text-muted-foreground">
              It needs WebGL, which some older phones and locked-down browsers do not
              provide. Every one of these bats can still be configured and ordered from
              its own product page.
            </p>
            <Link
              href="/categories/kashmir-willow-bats"
              className={buttonClass({ variant: "secondary", size: "sm" })}
            >
              Browse the bats
            </Link>
          </div>
        )}

        {status === "ready" && (
          <>
            <div
              role="group"
              aria-label="Camera views"
              className="absolute left-3 top-3 flex flex-wrap gap-1.5"
            >
              {VIEWS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => changeView(item.id)}
                  aria-pressed={view === item.id}
                  className={cn(
                    "rounded-sm border px-2.5 py-1 text-[11px] font-medium backdrop-blur transition-colors",
                    view === item.id
                      ? "border-accent/50 bg-accent-muted text-foreground"
                      : "border-border bg-surface/70 text-muted-foreground hover:border-border-strong hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2">
              <p className="text-[11px] leading-relaxed text-muted">
                Drag to rotate · scroll to zoom
                {hasEngraving && " · drag the engraving to move it"}
              </p>
              {measured && (
                <p className="rounded-sm border border-border bg-surface/70 px-2 py-1 text-[11px] tabular-nums text-muted-foreground backdrop-blur">
                  {measured.widthMm} mm wide · spine {measured.spineMm} mm · edge{" "}
                  {measured.edgeMm} mm
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-accent">
              Build your bat
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {product?.name ?? "Choose a bat"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {product?.blurb ?? ""}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={undo}
              disabled={past.length === 0}
              aria-label="Undo"
              className="rounded-sm border border-border p-2 text-muted-foreground transition-colors enabled:hover:border-border-strong enabled:hover:text-foreground disabled:opacity-30"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={future.length === 0}
              aria-label="Redo"
              className="rounded-sm border border-border p-2 text-muted-foreground transition-colors enabled:hover:border-border-strong enabled:hover:text-foreground disabled:opacity-30"
            >
              <RotateCw aria-hidden="true" className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Three bats, so three cards rather than a dropdown. A select would hide the
            willow and the price behind a tap, and those are the two things that
            actually distinguish them — the choice between these three *is* the
            choice of cleft and lead time. */}
        <Field
          label="Bat"
          help="The willow and the lead time come with the bat you choose."
        >
          <div className="flex flex-col gap-1.5">
            {studioProducts.map((item) => {
              const selected = item.slug === config.slug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => update({ slug: item.slug })}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-sm border p-3 text-left transition-colors",
                    selected
                      ? "border-accent/50 bg-accent-muted"
                      : "border-border hover:border-border-strong",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        selected ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {item.name}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {item.willow === "english"
                      ? "English willow"
                      : "Kashmir willow"}{" "}
                    · ready in {item.leadLabel}
                  </p>
                </button>
              );
            })}
          </div>
        </Field>

        {/* The four groups every made-to-order bat carries, in the same vocabulary the
            product page uses — so a bat configured here and one configured there are
            the same kind of thing in the cart. */}
        {BAT_OPTION_GROUPS.map((group) => (
          <Field key={group.id} label={group.label}>
            <Pills
              values={group.values}
              selected={config[group.id as "size" | "handle" | "profile" | "toe"]}
              onSelect={(id) => update({ [group.id]: id } as Partial<StudioConfig>)}
            />
          </Field>
        ))}

        <Field
          label="Weight"
          help="Heavier bats carry more wood in the edges and spine, so the shape changes with the weight."
        >
          <Pills
            values={weightValues}
            selected={config.weight}
            onSelect={(id) => update({ weight: id })}
          />
        </Field>

        <Field label={groupById("edge")!.label}>
          <Pills
            values={groupById("edge")!.values}
            selected={config.edge}
            onSelect={(id) => update({ edge: id })}
          />
        </Field>

        <Field label={groupById("toeGuard")!.label}>
          <Pills
            values={groupById("toeGuard")!.values}
            selected={config.toeGuard}
            onSelect={(id) => update({ toeGuard: id })}
          />
        </Field>

        <Field label="Sticker colourway">
          <Swatches
            values={groupById("sticker")!.values.map((v) => ({
              ...v,
              swatch: STICKER_ART[v.id]?.swatch ?? "#888",
            }))}
            selected={config.sticker}
            onSelect={(id) => update({ sticker: id })}
          />
        </Field>

        <Field label="Grip colour">
          <Swatches
            values={groupById("grip")!.values.map((v) => ({
              ...v,
              swatch: GRIP_COLOUR[v.id]?.swatch ?? "#888",
            }))}
            selected={config.grip}
            onSelect={(id) => update({ grip: id })}
          />
        </Field>

        {/* ── Engraving ── */}
        <div className="rounded-sm border border-border bg-surface-card p-4">
          <div className="flex items-baseline justify-between gap-2">
            <label
              htmlFor="studio-engraving"
              className="text-xs font-medium text-muted-foreground"
            >
              Laser engraving <span className="text-muted">(optional)</span>
            </label>
            <span className="text-xs text-muted">
              {engravingFree ? "Free" : formatPrice(siteConfig.engraving.price)}
            </span>
          </div>

          <input
            id="studio-engraving"
            value={config.engrave.text}
            onChange={(e) => updateEngrave({ text: e.target.value, on: true })}
            maxLength={ENGRAVING_MAX}
            placeholder="Name or initials"
            aria-invalid={engraveProblem ? true : undefined}
            className={cn(
              "mt-2 w-full rounded-sm border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors",
              engraveProblem
                ? "border-danger/60 focus:border-danger"
                : "border-border focus:border-accent/50",
            )}
          />
          <p
            className={cn(
              "mt-1.5 text-[11px]",
              engraveProblem ? "text-danger" : "text-muted",
            )}
          >
            {engraveProblem ??
              `${ENGRAVING_MAX - engraveText.length} characters left · burnt into the willow, not printed`}
          </p>

          {hasEngraving && (
            <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
              <Field label="Style" compact>
                <Pills
                  values={groupById("engraveFont")!.values}
                  selected={config.engrave.font}
                  onSelect={(id) => updateEngrave({ font: id })}
                />
              </Field>

              <Field label="Start from" compact>
                <Pills
                  values={ENGRAVE_PLACEMENTS.map((p) => ({
                    id: p.id,
                    label: p.label,
                  }))}
                  selected={
                    ENGRAVE_PLACEMENTS.find(
                      (p) =>
                        p.face === config.engrave.face &&
                        Math.abs(p.v - config.engrave.pos.v) < 0.004 &&
                        Math.abs(p.u - config.engrave.pos.u) < 0.004,
                    )?.id ?? null
                  }
                  onSelect={(id) => {
                    const place = ENGRAVE_PLACEMENTS.find((p) => p.id === id);
                    if (place) {
                      updateEngrave({
                        face: place.face,
                        pos: { u: place.u, v: place.v },
                      });
                    }
                  }}
                />
              </Field>

              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <label
                    htmlFor="studio-engrave-size"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Letter height
                  </label>
                  <span className="text-[11px] tabular-nums text-muted">
                    {millimetres ? `${Math.round(millimetres.capHeight)} mm` : "—"}
                  </span>
                </div>
                <input
                  id="studio-engrave-size"
                  type="range"
                  min={ENGRAVE_SIZE.min}
                  max={ENGRAVE_SIZE.max}
                  step={0.01}
                  value={config.engrave.size}
                  onChange={(e) =>
                    updateEngrave({ size: Number(e.target.value) }, { history: false })
                  }
                  className="mt-2 w-full accent-[var(--color-accent)]"
                />
              </div>

              {millimetres && (
                <p className="text-[11px] leading-relaxed text-muted">
                  {config.engrave.face === "back" ? "Spine" : "Playing face"} ·{" "}
                  {Math.round(millimetres.fromToe)} mm from the toe ·{" "}
                  {Math.abs(millimetres.across) < 5
                    ? "centred"
                    : `${Math.abs(Math.round(millimetres.across))} mm ${
                        millimetres.across < 0 ? "left" : "right"
                      } of centre`}
                  . Drag it on the bat to move it.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Price and the spec that travels ── */}
        <div className="rounded-sm border border-border-strong bg-surface p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Your bat
              </p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">
                {product ? formatPrice(product.price) : "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Ready in
              </p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {product?.leadLabel ?? "—"}
              </p>
            </div>
          </div>

          {/* Stated, not implied. The toe guard and the engraving are quoted on
              WhatsApp rather than charged here, which is the same rule the rest of
              the shop follows — so the figure above is the bat, and this says so. */}
          {(config.toeGuard === "clear" || (hasEngraving && !engravingFree)) && (
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              {config.toeGuard === "clear" && "A fitted toe guard"}
              {config.toeGuard === "clear" && hasEngraving && !engravingFree && " and "}
              {hasEngraving && !engravingFree && "the engraving"}
              {config.toeGuard === "clear" && hasEngraving && !engravingFree
                ? " are"
                : " is"}{" "}
              confirmed with you on WhatsApp and added to this figure.
            </p>
          )}

          <button
            type="button"
            onClick={onAdd}
            disabled={!product || Boolean(engraveProblem)}
            className={cn(
              buttonClass({ variant: added ? "secondary" : "primary", size: "md" }),
              "mt-4 w-full disabled:opacity-50",
            )}
          >
            {added ? (
              <>
                <Check aria-hidden="true" className="size-4" /> Added to cart
              </>
            ) : (
              <>
                <ShoppingBag aria-hidden="true" className="size-4" /> Add to cart
              </>
            )}
          </button>

          <details className="mt-4 border-t border-border pt-3">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
              What the workshop receives
            </summary>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              {workshopSpec.map((row) => (
                <div key={row.label} className="col-span-2 grid grid-cols-subgrid">
                  <dt className="text-[11px] text-muted">{row.label}</dt>
                  <dd className="text-[11px] text-foreground">{row.value}</dd>
                </div>
              ))}
              {hasEngraving && (
                <div className="col-span-2 grid grid-cols-subgrid">
                  <dt className="text-[11px] text-muted">Engraving</dt>
                  <dd className="text-[11px] text-foreground">{engraveText}</dd>
                </div>
              )}
              {measured && (
                <div className="col-span-2 grid grid-cols-subgrid">
                  <dt className="text-[11px] text-muted">Measured blade</dt>
                  <dd className="text-[11px] tabular-nums text-foreground">
                    {measured.widthMm} mm wide · spine {measured.spineMm} mm · edge{" "}
                    {measured.edgeMm} mm
                  </dd>
                </div>
              )}
            </dl>
            {/* The one honest caveat about a 3D preview. */}
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Every figure above is measured off the model on screen. Willow is a
              natural material, so a finished bat lands within a few millimetres and a
              few grams of it.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}

/* ── Small presentational pieces ─────────────────────────────────────────────── */

function Field({
  label,
  help,
  compact,
  children,
}: {
  label: string;
  help?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        className={cn(
          "font-medium text-muted-foreground",
          compact ? "text-[11px]" : "text-xs",
        )}
      >
        {label}
      </p>
      {help && <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{help}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Pills({
  values,
  selected,
  onSelect,
}: {
  values: { id: string; label: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <button
          key={value.id}
          type="button"
          onClick={() => onSelect(value.id)}
          aria-pressed={selected === value.id}
          className={cn(
            "rounded-sm border px-2.5 py-1.5 text-xs transition-colors",
            selected === value.id
              ? "border-accent/50 bg-accent-muted font-medium text-foreground"
              : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
          )}
        >
          {value.label}
        </button>
      ))}
    </div>
  );
}

function Swatches({
  values,
  selected,
  onSelect,
}: {
  values: { id: string; label: string; swatch: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <button
          key={value.id}
          type="button"
          onClick={() => onSelect(value.id)}
          aria-pressed={selected === value.id}
          // The colour is the label for sighted users and useless to a screen
          // reader, so the name goes in the accessible name and the tooltip.
          aria-label={value.label}
          title={value.label}
          className={cn(
            "size-8 rounded-sm border-2 transition-colors",
            selected === value.id
              ? "border-accent"
              : "border-border hover:border-border-strong",
          )}
          style={{ background: value.swatch }}
        />
      ))}
    </div>
  );
}

/* Referenced so the studio groups list is provably the source of the controls above
   rather than a parallel hand-written set. If a group is added to
   `BAT_STUDIO_OPTION_GROUPS` with no control here, this is the line that makes the
   omission findable. */
export const STUDIO_GROUP_IDS = BAT_STUDIO_OPTION_GROUPS.map((g) => g.id);
