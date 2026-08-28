/* ── Supported image formats, in one place ───────────────────────────────────────
 *
 * The rule this module exists to enforce: **the data supplies the path, and the path
 * is used as given**. Nothing here builds a filename, appends an extension, or decides
 * that a product must be a `.jpg`. Replacing `bat.jpg` with `bat.webp` is a one-line
 * change in the product record and nothing else in the app needs to know.
 *
 * There is deliberately no `getImageUrl(slug)` helper, because that is exactly the
 * function that grows an assumed extension inside it.
 */

/** Delivery formats. JPG and JPEG are the same format under two spellings. */
export const SUPPORTED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;

/** What an upload is allowed to be. Matches `ACCEPTED_IMAGE_TYPES` in
 *  `data/bat-doctor.ts`, which already validates to exactly these three.
 *
 *  SVG is absent on purpose and must stay absent: an SVG is a script-capable document,
 *  not a picture, and accepting one as a user upload is a stored-XSS vector. That is a
 *  separate question from *rendering* the generated SVG placeholders already in
 *  `public/products/placeholders/` — those are our own build artefacts, not uploads. */
export const SUPPORTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type SupportedImageMime = (typeof SUPPORTED_IMAGE_MIME_TYPES)[number];

/** Extension → MIME, for a future upload path that needs to cross-check a filename
 *  against a sniffed type. Both JPEG spellings map to one MIME. */
export const EXTENSION_TO_MIME: Record<string, SupportedImageMime> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** True for a path this site is willing to *deliver* as a product image.
 *
 *  Used for validating data, never for choosing a URL — a rendering component should
 *  simply render what it was given. */
export function isSupportedImagePath(path: string): boolean {
  const clean = path.split("?")[0]!.split("#")[0]!.toLowerCase();
  return SUPPORTED_IMAGE_EXTENSIONS.some((ext) => clean.endsWith(ext));
}

/** MIME for a path, or null when the extension is not one we support. Filename-based
 *  and therefore advisory: an upload must still be checked by content, because an
 *  attacker names the file. */
export function mimeForPath(path: string): SupportedImageMime | null {
  const clean = path.split("?")[0]!.split("#")[0]!.toLowerCase();
  const ext = SUPPORTED_IMAGE_EXTENSIONS.find((e) => clean.endsWith(e));
  return ext ? EXTENSION_TO_MIME[ext]! : null;
}
