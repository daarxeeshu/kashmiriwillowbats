import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";

/* ── The one product-image composition in this app ───────────────────────────────
 *
 * Before this existed there were four, and they disagreed on every axis: the card
 * used `aspect-[4/5]` on `bg-surface-elevated`, the detail page used `aspect-[4/5]`
 * on the cream `studio-bg`, the KIS panel used `aspect-square` with a blurred
 * backdrop, and its supporting rail used a fixed `h-20 w-16` on `bg-white/90`. Four
 * treatments, four `sizes` strings, four paddings — for the same eight photographs.
 *
 * The consequence was visible rather than theoretical: seven of the eight product
 * images are placeholder SVGs drawn on a cream gradient (#faf8f5 → #ebe4da) and the
 * eighth is a real studio JPEG on a near-black backdrop. Any fixed card colour is
 * therefore wrong for most of the catalogue — dark cards made the cream placeholders
 * read as lit slabs punched out of the page, and the cream detail page made the real
 * photograph read as a black rectangle stranded in milk.
 *
 * So the background is not a colour at all. It is derived from the image: a blurred,
 * cover-cropped copy of the same file, dimmed and scrimmed. Every product extends
 * into its own backdrop, so a dark photograph produces a dark surround and a light
 * one a warm muted glow, and the rectangular boundary of the image dissolves either
 * way. That is what makes it adaptive without a single per-product rule — the thing
 * §5 and §14 of the brief ask for. A product added tomorrow inherits it from its
 * own pixels.
 *
 * ── On aspect ratio ──
 * The *frame* is a fixed ratio; the *image* inside is `object-contain`. Both halves
 * of that matter. A consistent frame is what keeps a row of cards aligned (§8) — a
 * bat at 4:5 next to a helmet at 1:1 must not make one card taller than the other.
 * `object-contain` is what keeps the product itself undistorted and uncropped (§3,
 * §4) whatever its source ratio: tall bats fit to height, wide bags fit to width,
 * squares fit both. Nothing is ever stretched and nothing important is ever cut.
 * The brief allows exactly this split: the container may be consistent while the
 * fitting stays intelligent.
 */

export type ProductImageRatio = "portrait" | "tall" | "square" | "wide";

/** Frame ratios. `portrait` is the default and the one every card uses: it suits a
 *  1:3.5 bat better than a square while staying compact enough for a 2-up phone
 *  grid. The others exist for the contexts that legitimately need a different
 *  container — never for a different *logic*. */
const RATIO: Record<ProductImageRatio, string> = {
  portrait: "aspect-[4/5]",
  tall: "aspect-[1/2]",
  square: "aspect-square",
  wide: "aspect-[4/3]",
};

/** Bats, and the reason they need their own frame.
 *
 *  Under object-cover the frame's proportion decides how much of the subject survives.
 *  A bat photographed whole is about 1:2.6, so a 4:5 frame keeps only the middle band
 *  of it and crops away handle and toe; a 1:2 frame is close enough to the subject that
 *  little is lost. The frame is chosen to suit the shape rather than the image being
 *  shrunk to suit the frame.
 *
 *  Keyed off the category rather than the product because it is a fact about the
 *  *subject*, not about one file: every bat is this shape and a helmet is not. That is
 *  also what keeps it honest for the rest of the catalogue — pads, gloves, balls and
 *  bags stay at `portrait`, where a 1:2 frame would strand them in vertical space the
 *  same way 4:5 strands a bat in horizontal. A new bat category inherits it by adding
 *  one slug; a new equipment category inherits the default by doing nothing. */
const TALL_SUBJECT_CATEGORIES = new Set([
  "kashmir-willow-bats",
  "english-willow-bats",
  "hard-tennis-bats",
]);

export function ratioForCategory(categorySlug: string): ProductImageRatio {
  return TALL_SUBJECT_CATEGORIES.has(categorySlug) ? "tall" : "portrait";
}

interface ProductImageFrameProps {
  src: string;
  /** Empty string marks the image decorative — correct when an adjacent heading
   *  already names the product, as on the detail page. */
  alt: string;
  /** Required, not defaulted. A wrong `sizes` silently ships a 4× oversized file
   *  to every phone, and it can only be known by the caller: it has to describe the
   *  grid this frame is sitting in. Callers use the exported constants below. */
  sizes: string;
  ratio?: ProductImageRatio;
  /** Above-the-fold only. Sets `priority` and eager decoding; everything else stays
   *  lazy, which is what keeps a long catalogue page cheap. */
  priority?: boolean;
  /** Zoom the product on hover. Requires an ancestor with `group`. Off for
   *  non-interactive contexts like the detail page hero. */
  interactive?: boolean;
  className?: string;
}

/** The grid this app puts product cards in: 2-up on phones, 3-up from 768, 4-up from
 *  1024. Written `min-width`-first so it mirrors `PRODUCT_GRID_LADDER`'s Tailwind
 *  breakpoints exactly rather than approximating them with off-by-one `max-width`
 *  values — `sizes` takes the first matching clause, so descending order resolves the
 *  same way the CSS cascade does. Each figure is the next whole vw above the measured
 *  card width, so the browser never under-requests: at 768 the card is 224px of a
 *  753px content width (29.7vw) and this claims 33vw. Exported so the ladder and the
 *  `sizes` attribute cannot drift apart — change one and this is the other half. */
export const PRODUCT_CARD_SIZES =
  "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw";

/** Full-bleed on a phone, half the viewport once the detail page splits into two
 *  columns at `lg`. */
export const PRODUCT_HERO_SIZES = "(max-width: 1024px) 100vw, 50vw";

export function ProductImageFrame({
  src,
  alt,
  sizes,
  ratio = "portrait",
  priority = false,
  interactive = true,
  className,
}: ProductImageFrameProps) {
  return (
    <div className={cn("relative overflow-hidden", RATIO[ratio], className)}>
      {/* Ambient wash — the background integration, derived per product.
          `sizes="32px"` because this layer is blurred past all detail: asking for a
          32px derivative of a 1MB studio shot and stretching it is the cheap way to
          do this, and at `blur-3xl` the result is indistinguishable from blurring
          the full-size file. `scale-125` pushes the blur's soft edge outside the
          frame so there is no pale halo along the border. Never `priority` — it is
          decoration and must not compete with the product for bandwidth. */}
      <SafeImage
        src={src}
        alt=""
        aria-hidden="true"
        fill
        sizes="32px"
        className="scale-125 object-cover blur-3xl saturate-[1.2]"
      />

      {/* Scrim. Without it a cream placeholder blurs up into a bright panel that
          fights the dark page and drags the card's contrast the wrong way. Weighted
          to the bottom, where the card's text sits and where the plinth lands. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#0e0d0b]/55 via-[#0e0d0b]/35 to-[#0e0d0b]/75"
      />

      {/* Contact shadow under the product. */}
      <div
        aria-hidden="true"
        className="product-plinth absolute inset-x-0 bottom-0 h-[38%]"
      />

      {/* The product, filling the frame.

          "object-cover" and not "contain": contain fits the image inside the box and
          leaves the surplus on whichever axis runs out first, which is the whitespace
          this frame used to show. Cover scales to the larger axis and crops the
          overflow, so the image reaches all four edges at every width. Neither ever
          distorts - both preserve the source ratio; they differ only in which of
          "show all of it" and "fill all of it" gives way, and here it is the former.

          "fill" already emits position:absolute, inset:0, width:100%, height:100%, so
          the box is the frame's and the frame's own proportion is a CSS aspect-ratio.
          Nothing here is a fixed pixel size, so the container reflows with the card at
          every breakpoint rather than carrying a desktop measurement onto a phone.

          "object-center" keeps the crop taken from the middle, so a subject shot
          centred stays centred whichever edge is trimmed.

          No padding and no drop-shadow. The padding was the second cause of the gap -
          it inset the image from all four edges after contain had already shrunk it -
          and the shadow only ever made sense against a contained silhouette; over a
          full-bleed rectangle it is a filter pass rendering nothing the frame does not
          already clip. */}
      <SafeImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn(
          "object-cover object-center",
          interactive &&
            "transition-transform duration-500 ease-out group-hover:scale-[1.04]",
        )}
      />
    </div>
  );
}
