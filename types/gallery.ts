/* ── Wall of Fame ────────────────────────────────────────────────────────────────
 *
 * The shape a gallery entry has, defined so the admin panel and Supabase can adopt it
 * without the gallery being rebuilt. Every field an admin will eventually edit exists
 * here now, even where nothing writes it yet — `published`, `featured` and
 * `displayOrder` are read by the selectors in `data/gallery.ts` today, so wiring a
 * database in later replaces the source of the array and nothing else.
 */

export type GalleryCategory =
  | "international"
  | "professional"
  | "icon"
  | "kashmir"
  | "local"
  | "under-19"
  | "customer";

/** Which part of a photograph must survive the crop.
 *
 *  A player photograph is not a product shot: the face, the bat and the jersey are the
 *  content, and a centred crop of a tall action photo removes the head. This maps to
 *  `object-position`, so a portrait taken with the subject high in the frame is told
 *  so rather than being cropped through the chin. */
export type FocalPoint = "center" | "top" | "bottom" | "left" | "right";

export interface GalleryItem {
  id: string;
  /** Person's name as they wish to be credited. */
  name: string;
  /** Path or URL to the photograph. Any supported format — see `lib/images.ts`. */
  image: string;
  category: GalleryCategory;
  /** Town, club or ground. Shown only when supplied: it is optional precisely because
   *  it should never be inferred, and never for a minor without consent. */
  location?: string;
  /** Free text under the name — "Opening batter", "U19 squad", "Customer". */
  playerType?: string;
  /** Product slug of the bat, when the person told us. Resolved to a real product name
   *  at render, so a renamed product cannot leave a stale label behind. */
  batUsed?: string;
  /** One short line in their words. Not a testimonial we wrote for them. */
  caption?: string;
  /** Larger tile on the wall. Editorial weight, not a claim about the person. */
  featured?: boolean;
  /** Ascending. Ties fall back to array order. */
  displayOrder?: number;
  /** Nothing renders unless this is true. The default for a new submission — and for
   *  every under-19 entry — is false until an admin approves it. */
  published: boolean;
  /** ISO string. Set by the backend when one exists. */
  createdAt?: string;
  /** Which part of the frame to protect when cropping. Defaults to "center". */
  focal?: FocalPoint;
  /** Development stand-in rather than a real person. Renders a visible marker, the
   *  same discipline `isPlaceholder` follows on products: nobody should have to guess
   *  which faces on this wall are real. */
  isPlaceholder?: boolean;
}

export interface GalleryCategoryMeta {
  id: GalleryCategory | "all";
  label: string;
  /** Shown under the heading when that filter is active. */
  blurb?: string;
}
