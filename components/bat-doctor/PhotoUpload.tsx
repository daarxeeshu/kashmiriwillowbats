"use client";

import { useCallback, useId, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Film, Upload, X } from "lucide-react";
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  MAX_IMAGES,
  photoGuide,
} from "@/data/bat-doctor";
import { validateMedia, readyMedia } from "@/lib/bat-doctor/validate";
import type { MediaItem } from "@/types/bat-doctor";
import { cn } from "@/lib/utils";

/* ── §15–§17 · Show us the damage ─────────────────────────────────────────────────
 *
 * The brief calls this "one of the most important parts", and it is right for a reason
 * that has nothing to do with the UI: a technician cannot triage a bat they cannot see,
 * so every photograph attached here is a phone call that does not have to happen.
 *
 * Three things drive the implementation.
 *
 * `capture="environment"` on a second, separate input is what §16 is actually asking
 * for. One input cannot both open the camera and open the file picker — the attribute
 * decides which — so TAKE PHOTO and UPLOAD FROM DEVICE are two inputs behind two
 * buttons. On desktop the camera input falls back to a picker, which is why the camera
 * button is only shown where it means something.
 *
 * Object URLs are revoked on removal and on replacement. An un-revoked `blob:` URL pins
 * the entire file in memory for the life of the document, and this form exists to
 * receive several multi-megabyte photographs from a phone.
 *
 * Files are validated the moment they are picked, with the same `validateMedia` the
 * route handler runs. A rejected file still gets a card — with its reason on it —
 * because silently dropping a file the customer believes they attached is how a request
 * arrives with no photographs of the break. */

interface PhotoUploadProps {
  images: MediaItem[];
  video: MediaItem | null;
  onAddImages: (files: File[]) => void;
  onRemoveImage: (id: string) => void;
  onSetVideo: (file: File | null) => void;
  error?: string;
}

/** `crypto.randomUUID` is available in every browser this project targets; the fallback
 *  keeps it from throwing on an insecure origin, where it is undefined. */
export function mediaId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `m-${Math.random().toString(36).slice(2)}-${performance.now().toFixed(0)}`;
}

/** Builds a `MediaItem` from a picked file, running the shared validator so a rejected
 *  file is still a visible card with a reason rather than a silent no-op. Exported
 *  because the state owner creates the items — this component only reports picks. */
export function toMediaItem(file: File, kind: "image" | "video"): MediaItem {
  const problem = validateMedia(
    { name: file.name, size: file.size, mime: file.type },
    kind,
  );

  return {
    id: mediaId(),
    file,
    name: file.name,
    size: file.size,
    mime: file.type,
    kind,
    // No preview for a file we are not accepting — creating an object URL for it would
    // allocate memory for something about to be thrown away.
    previewUrl: problem ? "" : URL.createObjectURL(file),
    status: problem ? "error" : "ready",
    error: problem ?? undefined,
  };
}

function sizeLabel(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const PICK_BUTTON =
  "flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.04] " +
  "px-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-white/85 " +
  "transition-colors duration-200 hover:border-expert/50 hover:bg-expert/10 hover:text-white " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert";

export function PhotoUpload({
  images,
  video,
  onAddImages,
  onRemoveImage,
  onSetVideo,
  error,
}: PhotoUploadProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const statusId = useId();
  const [dragging, setDragging] = useState(false);

  // Capacity counts usable photographs only. A rejected card still occupies the grid, but
  // it is not one of the eight we can accept — spending a slot on a file the customer has
  // been told is unusable means they have to remove it before they can add a good one.
  const usable = readyMedia(images).length;
  const remaining = MAX_IMAGES - usable;
  const full = remaining <= 0;

  const accept = ACCEPTED_IMAGE_TYPES.join(",");
  const videoAccept = ACCEPTED_VIDEO_TYPES.join(",");

  const handlePick = useCallback(
    (fileList: FileList | null, input: HTMLInputElement | null) => {
      if (!fileList || fileList.length === 0) return;
      onAddImages(Array.from(fileList).slice(0, Math.max(0, remaining)));
      // Reset the input, or picking the same file twice in a row fires no change event
      // — which reads to the customer as the second attempt being ignored.
      if (input) input.value = "";
    },
    [onAddImages, remaining],
  );

  return (
    <div className="min-w-0 space-y-5">
      {/* ── What to photograph. Above the buttons on purpose: guidance after the
             action is guidance nobody reads. ── */}
      <div className="bd-panel rounded-xl p-4 sm:p-5">
        <p className="eyebrow">Photographs that help most</p>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {photoGuide.map((shot, index) => (
            <li key={shot.label} className="flex gap-2.5">
              <span
                aria-hidden="true"
                className="mt-px font-mono text-[11px] text-expert/70"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-medium text-white/90">
                  {shot.label}
                </span>
                <span className="block text-[12.5px] leading-snug text-white/45">
                  {shot.hint}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── The two pick paths (§16) ── */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (full) return;
          const dropped = Array.from(event.dataTransfer.files).filter((file) =>
            file.type.startsWith("image/"),
          );
          if (dropped.length) onAddImages(dropped.slice(0, Math.max(0, remaining)));
        }}
        className={cn(
          "rounded-xl border border-dashed p-4 transition-colors duration-200 sm:p-5",
          dragging
            ? "border-expert/60 bg-expert/[0.07]"
            : error
              ? "border-danger/50 bg-danger-muted"
              : "border-white/14 bg-white/[0.02]",
        )}
      >
        <div className="flex flex-col gap-2.5 sm:flex-row">
          {/* Camera. `md:hidden` because on a laptop this opens the same picker as the
              button beside it, and two buttons that do the same thing is worse than
              one. */}
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={full}
            className={cn(PICK_BUTTON, "md:hidden", full && "opacity-40")}
          >
            <Camera className="size-4" aria-hidden="true" />
            Take photo
          </button>

          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={full}
            className={cn(PICK_BUTTON, full && "opacity-40")}
          >
            <Upload className="size-4" aria-hidden="true" />
            <span className="md:hidden">Upload from device</span>
            <span className="hidden md:inline">Choose photographs</span>
          </button>
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept={accept}
          capture="environment"
          multiple
          onChange={(event) => handlePick(event.target.files, cameraRef.current)}
          className="sr-only"
          // Labelled rather than hidden from the tree: the buttons above are the
          // visible control, but a screen-reader user navigating by form field should
          // still find something that says what it is.
          aria-label="Take a photograph of your bat"
          tabIndex={-1}
        />
        <input
          ref={galleryRef}
          type="file"
          accept={accept}
          multiple
          onChange={(event) => handlePick(event.target.files, galleryRef.current)}
          className="sr-only"
          aria-label="Choose photographs of your bat from your device"
          tabIndex={-1}
        />

        <p
          id={statusId}
          aria-live="polite"
          className="mt-3 text-[12.5px] text-white/45"
        >
          {full
            ? `That's the maximum of ${MAX_IMAGES} photographs.`
            : `${usable} of ${MAX_IMAGES} attached · JPG, PNG or WebP · up to 10 MB each`}
        </p>

        {error && (
          <p role="alert" className="mt-2 flex items-start gap-1.5 text-[13px] text-danger">
            <span aria-hidden="true" className="mt-px font-semibold">
              !
            </span>
            {error}
          </p>
        )}
      </div>

      {/* ── Thumbnails (§15) ── */}
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {images.map((item) => (
            <li
              key={item.id}
              className={cn(
                "group/photo relative overflow-hidden rounded-lg border bg-surface-card",
                item.status === "error" ? "border-danger/55" : "border-white/12",
              )}
            >
              <div className="relative aspect-square">
                {item.previewUrl ? (
                  <Image
                    src={item.previewUrl}
                    alt={`Photograph of your bat: ${item.name}`}
                    fill
                    // A `blob:` URL cannot go through the optimiser — it exists only in
                    // this browser tab and the server has nothing to fetch.
                    unoptimized
                    sizes="(min-width: 768px) 25vw, 45vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-3 text-center">
                    <span className="text-[11.5px] leading-snug text-danger">
                      Couldn&apos;t use this file
                    </span>
                  </div>
                )}
              </div>

              {/* 44px hit area, visible without hover — an `opacity-0` remove button is
                  unreachable on a touchscreen, which is the primary device here. */}
              <button
                type="button"
                onClick={() => onRemoveImage(item.id)}
                className="absolute right-1.5 top-1.5 flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/65 text-white/90 backdrop-blur-sm transition-colors hover:border-danger/60 hover:bg-danger/85 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert"
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Remove {item.name}</span>
              </button>

              <div className="border-t border-white/8 px-2.5 py-2">
                <p className="truncate text-[11.5px] text-white/70" title={item.name}>
                  {item.name}
                </p>
                <p
                  className={cn(
                    "text-[11px]",
                    item.status === "error" ? "text-danger" : "text-white/35",
                  )}
                >
                  {item.status === "error" ? item.error : sizeLabel(item.size)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ── Optional video (§17) ──
             Labelled optional in the heading itself, not just in a hint, because the
             brief is explicit that this must not read as required. */}
      <div className="bd-panel rounded-xl p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/70">
            Upload a short video
          </p>
          <span className="text-[11px] font-medium text-white/35">optional</span>
        </div>
        <p className="mt-1.5 text-[13px] leading-snug text-white/45">
          A few seconds of the bat flexing or the crack under light tells us more than a
          still can. Skip it if it&apos;s awkward.
        </p>

        {video ? (
          <div
            className={cn(
              "mt-3 flex items-center gap-3 rounded-lg border px-3 py-2.5",
              video.status === "error"
                ? "border-danger/55 bg-danger-muted"
                : "border-white/12 bg-white/[0.03]",
            )}
          >
            <Film className="size-4 shrink-0 text-expert/80" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-white/85">{video.name}</p>
              <p
                className={cn(
                  "text-[11.5px]",
                  video.status === "error" ? "text-danger" : "text-white/40",
                )}
              >
                {video.status === "error" ? video.error : sizeLabel(video.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSetVideo(null)}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expert"
            >
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">Remove video</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => videoRef.current?.click()}
            className={cn(PICK_BUTTON, "mt-3 w-full")}
          >
            <Film className="size-4" aria-hidden="true" />
            Add a video
          </button>
        )}

        <input
          ref={videoRef}
          type="file"
          accept={videoAccept}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            onSetVideo(file);
            if (videoRef.current) videoRef.current.value = "";
          }}
          className="sr-only"
          aria-label="Upload a short video of your bat (optional)"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
