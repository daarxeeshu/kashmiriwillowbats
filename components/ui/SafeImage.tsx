"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── next/image, but a missing file cannot break the page ────────────────────────
 *
 * A drop-in replacement: same props, same optimisation, same `fill`/`sizes`
 * behaviour. The only addition is what happens when the file is not there.
 *
 * Without it, a 404 renders the browser's broken-image glyph inside an otherwise
 * finished card — or, with `fill`, an empty transparent box that looks like a layout
 * bug. Neither is recoverable by the reader and both look like the site is broken
 * rather than one photograph being absent.
 *
 * ── What it deliberately does not do ──
 * It does not substitute a different file. A fallback image is itself a path that can
 * 404, and a fallback that fails leaves you exactly where you started. Instead the
 * frame's own background shows through with a small mark on it, which cannot fail and
 * needs no asset.
 *
 * It also does not guess formats. There is no "try .jpg, then .webp" retry: that would
 * make the extension load-bearing again, which is the thing this architecture exists
 * to avoid. The path in the data is the path, and if it is wrong the data is wrong.
 *
 * ── Layout ──
 * The fallback occupies the same box as the image — `fill` keeps its absolute inset,
 * a sized image keeps its width and height — so nothing reflows when a load fails.
 */

interface SafeImageProps extends ImageProps {
  /** Extra classes for the fallback panel only. The frame usually supplies its own
   *  background, so this is normally left alone. */
  fallbackClassName?: string;
}

export function SafeImage({
  className,
  fallbackClassName,
  onError,
  alt,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        // Not `aria-hidden`: a decorative image (alt="") stays silent here too, but a
        // named one still owes the reader an explanation of what is missing.
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={cn(
          props.fill
            ? "absolute inset-0 h-full w-full"
            : "flex h-full w-full items-center justify-center",
          "flex items-center justify-center bg-surface-elevated",
          fallbackClassName,
        )}
        style={
          // A non-fill image is laid out by width/height; the fallback has to hold the
          // same box or the card shrinks around a missing photo.
          props.fill
            ? undefined
            : { width: props.width as number, height: props.height as number }
        }
      >
        <ImageOff className="size-5 text-muted" aria-hidden="true" />
      </div>
    );
  }

  return (
    <Image
      {...props}
      alt={alt}
      className={className}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
